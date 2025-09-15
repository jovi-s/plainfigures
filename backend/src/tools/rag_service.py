"""
RAG Service using LlamaIndex + FAISS for advanced document querying
Integrates with existing SQLite database for metadata management
"""

import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

import faiss
import numpy as np
from llama_index.core import (
    VectorStoreIndex, 
    Document, 
    Settings,
    StorageContext,
    load_index_from_storage
)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.vector_stores.faiss import FaissVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.postprocessor import SimilarityPostprocessor
from llama_index.readers.file import PDFReader
import fitz  # PyMuPDF for better text extraction

from src.utils.db import (
    save_rag_document, 
    save_rag_chunk, 
    save_rag_query,
    get_rag_documents,
    get_rag_document_by_id,
    get_rag_document_by_file_path
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGService:
    """Advanced RAG service using LlamaIndex + FAISS for business document querying"""
    
    def __init__(self):
        self.embed_model = OpenAIEmbedding(
            model="text-embedding-3-small",
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        self.llm = OpenAI(
            model="gpt-4o-mini",
            api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0.1
        )
        
        # Set global settings
        Settings.embed_model = self.embed_model
        Settings.llm = self.llm
        
        # Initialize components
        self.vector_store = None
        self.index = None
        self.query_engine = None
        
        # Paths
        self.data_dir = Path(__file__).parent.parent.parent / "database"
        self.index_dir = self.data_dir / "rag_index"
        self.index_dir.mkdir(exist_ok=True)
        
        # Document directories
        self.concepts_dir = self.data_dir / "concepts"
        self.countries_dir = self.data_dir / "countries"
        
        logger.info("RAG Service initialized")
    
    def _is_readable_pdf(self, pdf_path: Path) -> bool:
        """Check if PDF contains readable text (not just images/scanned)"""
        try:
            doc = fitz.open(pdf_path)
            total_text = ""
            
            # Check first 3 pages for readable text
            for page_num in range(min(3, len(doc))):
                page = doc[page_num]
                text = page.get_text()
                total_text += text
            
            doc.close()
            
            # Check if we have substantial readable text (not just control characters)
            readable_chars = sum(1 for c in total_text if c.isalnum() or c.isspace())
            total_chars = len(total_text)
            
            # If less than 20% of characters are readable, consider it unreadable
            readability_ratio = readable_chars / total_chars if total_chars > 0 else 0
            
            logger.info(f"PDF {pdf_path.name}: {readable_chars}/{total_chars} readable chars ({readability_ratio:.2%})")
            
            return readability_ratio > 0.2
            
        except Exception as e:
            logger.error(f"Error checking PDF readability {pdf_path}: {e}")
            return False
    
    def _load_documents(self) -> List[Document]:
        """Load all documents from the database directories"""
        documents = []
        
        # Load text files from concepts directory
        if self.concepts_dir.exists():
            for txt_file in self.concepts_dir.glob("*.txt"):
                try:
                    with open(txt_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    doc = Document(
                        text=content,
                        metadata={
                            "filename": txt_file.name,
                            "file_path": str(txt_file),
                            "content_type": "text/plain",
                            "source": "concepts"
                        }
                    )
                    documents.append(doc)
                    logger.info(f"Loaded text document: {txt_file.name}")
                    
                except Exception as e:
                    logger.error(f"Error loading {txt_file}: {e}")
        
        # Load PDF files from countries directory
        if self.countries_dir.exists():
            pdf_reader = PDFReader()
            for pdf_file in self.countries_dir.rglob("*.pdf"):
                try:
                    logger.info(f"Processing PDF: {pdf_file.name}")
                    
                    # Check if PDF is readable first
                    if not self._is_readable_pdf(pdf_file):
                        logger.warning(f"Skipping unreadable PDF: {pdf_file.name} (likely image-based/scanned)")
                        continue
                    
                    # Load PDF using LlamaIndex PDF reader
                    pdf_docs = pdf_reader.load_data(file=pdf_file)
                    
                    # Add metadata to each document
                    for doc in pdf_docs:
                        doc.metadata.update({
                            "filename": pdf_file.name,
                            "file_path": str(pdf_file),
                            "content_type": "application/pdf",
                            "source": "countries",
                            "country": pdf_file.parent.name
                        })
                    
                    documents.extend(pdf_docs)
                    logger.info(f"Loaded PDF document: {pdf_file.name} ({len(pdf_docs)} pages)")
                    
                except Exception as e:
                    logger.error(f"Error loading PDF {pdf_file}: {e}")
        
        return documents
    
    def _create_vector_store(self, documents: List[Document]) -> FaissVectorStore:
        """Create FAISS vector store from documents"""
        # Create FAISS index
        dimension = 1536  # OpenAI text-embedding-3-small dimension
        faiss_index = faiss.IndexFlatL2(dimension)
        
        # Create vector store
        vector_store = FaissVectorStore(faiss_index=faiss_index)
        
        # Create storage context
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        
        # Create index
        self.index = VectorStoreIndex.from_documents(
            documents, 
            storage_context=storage_context,
            show_progress=True
        )
        
        logger.info(f"Created FAISS vector store with {len(documents)} documents")
        return vector_store
    
    def _save_documents_to_db(self, documents: List[Document]):
        """Save document metadata to SQLite database"""
        for doc in documents:
            try:
                file_path = doc.metadata.get("file_path", "")
                filename = doc.metadata.get("filename", "unknown")
                
                # Check if document already exists
                existing_doc = get_rag_document_by_file_path(file_path)
                if existing_doc:
                    logger.info(f"Document already exists in DB, skipping: {filename}")
                    continue
                
                # Save document metadata
                doc_id = save_rag_document(
                    filename=filename,
                    file_path=file_path,
                    content_type=doc.metadata.get("content_type", "text/plain"),
                    file_size=len(doc.text),
                    metadata=doc.metadata
                )
                
                # Save document chunks
                # For now, we'll save the entire document as one chunk
                # LlamaIndex handles the actual chunking internally
                save_rag_chunk(
                    document_id=doc_id,
                    chunk_text=doc.text[:1000],  # First 1000 chars as preview
                    chunk_index=0,
                    token_count=len(doc.text.split())
                )
                
                logger.info(f"Saved document to DB: {filename}")
                
            except Exception as e:
                logger.error(f"Error saving document to DB: {e}")
    
    def build_index(self) -> bool:
        """Build the RAG index from documents"""
        try:
            logger.info("Building RAG index...")
            
            # Load documents
            documents = self._load_documents()
            if not documents:
                logger.warning("No documents found to index")
                return False
            
            # Create vector store and index
            self.vector_store = self._create_vector_store(documents)
            
            # Save documents to database
            self._save_documents_to_db(documents)
            
            # Create query engine with advanced settings
            retriever = VectorIndexRetriever(
                index=self.index,
                similarity_top_k=5,  # Retrieve top 5 relevant chunks
            )
            
            # Add post-processor for better results
            postprocessor = SimilarityPostprocessor(similarity_cutoff=0.7)
            
            self.query_engine = RetrieverQueryEngine(
                retriever=retriever,
                node_postprocessors=[postprocessor]
            )
            
            # Save index to disk
            self.index.storage_context.persist(persist_dir=str(self.index_dir))
            
            logger.info("RAG index built successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error building RAG index: {e}")
            return False
    
    def load_index(self) -> bool:
        """Load existing RAG index from disk"""
        try:
            if not (self.index_dir / "vector_store.json").exists():
                logger.info("No existing index found, building new one...")
                return self.build_index()
            
            # Load FAISS index
            dimension = 1536
            faiss_index = faiss.IndexFlatL2(dimension)
            vector_store = FaissVectorStore(faiss_index=faiss_index)
            
            # Load storage context
            storage_context = StorageContext.from_defaults(
                vector_store=vector_store,
                persist_dir=str(self.index_dir)
            )
            
            # Load index
            self.index = load_index_from_storage(storage_context)
            self.vector_store = vector_store
            
            # Create query engine
            retriever = VectorIndexRetriever(
                index=self.index,
                similarity_top_k=5,
            )
            
            postprocessor = SimilarityPostprocessor(similarity_cutoff=0.7)
            
            self.query_engine = RetrieverQueryEngine(
                retriever=retriever,
                node_postprocessors=[postprocessor]
            )
            
            logger.info("RAG index loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error loading RAG index: {e}")
            return False
    
    def query(self, question: str, user_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Query the RAG system with advanced reasoning"""
        try:
            if not self.query_engine:
                if not self.load_index():
                    return {
                        "success": False,
                        "error": "RAG index not available",
                        "response": "I'm sorry, but I don't have access to the business knowledge base at the moment."
                    }
            
            # Enhanced prompt for business context with country-specific focus
            enhanced_question = f"""
            Based on the business, regulatory, and country-specific documents provided, please answer the following question with specific, actionable insights:
            
            Question: {question}
            
            Please provide:
            1. A direct answer based on the documents
            2. Specific examples or references from the documents (including page numbers if from PDFs)
            3. Practical implications for business operations
            4. Any relevant regulatory considerations (especially Singapore-specific if applicable)
            5. Country-specific insights if the question relates to Singapore or Southeast Asia
            
            If the information is not available in the documents, please state this clearly.
            Focus on actionable business advice and regulatory compliance information.
            """
            
            # Query the system
            response = self.query_engine.query(enhanced_question)
            
            # Extract sources
            sources = []
            if hasattr(response, 'source_nodes'):
                for node in response.source_nodes:
                    sources.append({
                        "text": node.text[:200] + "..." if len(node.text) > 200 else node.text,
                        "score": node.score,
                        "metadata": node.metadata
                    })
            
            # Save query to database (without confidence_score since it's not in schema)
            save_rag_query(
                query_text=question,
                response_text=response.response,
                sources=sources,
                user_context=user_context
            )
            
            return {
                "success": True,
                "response": response.response,
                "sources": sources,
                "confidence": 0.8,
                "query_id": None  # Could be returned from save_rag_query
            }
            
        except Exception as e:
            logger.error(f"Error querying RAG system: {e}")
            return {
                "success": False,
                "error": str(e),
                "response": "I encountered an error while searching the knowledge base. Please try again."
            }
    
    def get_document_stats(self) -> Dict[str, Any]:
        """Get statistics about indexed documents"""
        try:
            documents = get_rag_documents()
            
            stats = {
                "total_documents": len(documents),
                "documents": [
                    {
                        "id": doc["id"],
                        "filename": doc["filename"],
                        "content_type": doc["content_type"],
                        "file_size": doc["file_size"],
                        "created_at": doc["created_at"],
                        "status": doc.get("status", "unknown")
                    }
                    for doc in documents
                ]
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting document stats: {e}")
            return {"error": str(e)}


# Global RAG service instance
_rag_service = None

def get_rag_service() -> RAGService:
    """Get or create the global RAG service instance"""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
