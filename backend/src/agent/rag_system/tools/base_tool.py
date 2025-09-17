"""
Base tool class for RAG data sources
"""

import os
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pathlib import Path

import faiss
import numpy as np
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS as LangChainFAISS

logger = logging.getLogger(__name__)


class BaseRAGTool(ABC):
    """Base class for RAG data source tools"""
    
    def __init__(self, tool_name: str, data_dir: Optional[Path] = None):
        self.tool_name = tool_name
        self.data_dir = data_dir or Path(__file__).parent.parent.parent.parent.parent / "database"
        self.vector_store_dir = self.data_dir / "vector_stores" / tool_name
        self.vector_store_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize embeddings
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Vector store will be loaded lazily
        self.vector_store: Optional[LangChainFAISS] = None
        self.is_initialized = False
        
        logger.info(f"Initialized {tool_name} tool")
    
    @abstractmethod
    def load_documents(self) -> List[Document]:
        """Load documents from the data source"""
        pass
    
    def _create_vector_store(self, documents: List[Document]) -> LangChainFAISS:
        """Create FAISS vector store from documents"""
        if not documents:
            raise ValueError(f"No documents found for {self.tool_name}")
        
        # Create vector store
        vector_store = LangChainFAISS.from_documents(
            documents, 
            self.embeddings
        )
        
        # Save to disk
        vector_store.save_local(str(self.vector_store_dir))
        logger.info(f"Created and saved vector store for {self.tool_name} with {len(documents)} documents")
        
        return vector_store
    
    def _load_vector_store(self) -> Optional[LangChainFAISS]:
        """Load existing vector store from disk"""
        try:
            if (self.vector_store_dir / "index.faiss").exists():
                vector_store = LangChainFAISS.load_local(
                    str(self.vector_store_dir),
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                logger.info(f"Loaded existing vector store for {self.tool_name}")
                return vector_store
        except Exception as e:
            logger.error(f"Error loading vector store for {self.tool_name}: {e}")
        
        return None
    
    def initialize(self, force_rebuild: bool = False) -> bool:
        """Initialize the vector store"""
        try:
            if not force_rebuild:
                # Try to load existing vector store
                self.vector_store = self._load_vector_store()
            
            if self.vector_store is None:
                # Create new vector store
                documents = self.load_documents()
                if not documents:
                    logger.warning(f"No documents found for {self.tool_name}")
                    return False
                
                self.vector_store = self._create_vector_store(documents)
            
            self.is_initialized = True
            return True
            
        except Exception as e:
            logger.error(f"Error initializing {self.tool_name}: {e}")
            return False
    
    def search(self, query: str, k: int = 5, score_threshold: float = 0.3) -> List[Dict[str, Any]]:
        """Search for relevant documents"""
        if not self.is_initialized:
            if not self.initialize():
                return []
        
        if self.vector_store is None:
            return []
        
        try:
            # First try without threshold to see what scores we get
            all_results = self.vector_store.similarity_search_with_score(query, k=k*2)
            logger.info(f"{self.tool_name} - Raw similarity scores: {[float(score) for _, score in all_results[:3]]}")
            
            # Filter by threshold manually (LangChain FAISS scores are distance-based, lower = better)
            # Convert distance to similarity: similarity = 1 / (1 + distance)
            results = []
            for doc, distance in all_results:
                similarity = 1 / (1 + distance) if distance >= 0 else 1.0
                if similarity >= score_threshold:
                    results.append((doc, similarity))
            
            # Limit to k results
            results = results[:k]
            logger.info(f"{self.tool_name} - Found {len(results)} results above threshold {score_threshold}")
            
            # Format results
            formatted_results = []
            for doc, score in results:
                # Ensure metadata is JSON serializable
                clean_metadata = {}
                for key, value in doc.metadata.items():
                    if isinstance(value, (int, float, str, bool, type(None))):
                        clean_metadata[key] = value
                    else:
                        # Convert other types to string for JSON compatibility
                        clean_metadata[key] = str(value)
                
                formatted_results.append({
                    "content": doc.page_content,
                    "metadata": clean_metadata,
                    "score": float(score),  # Convert numpy.float32 to Python float for JSON serialization
                    "tool_name": self.tool_name
                })
            
            logger.info(f"{self.tool_name} found {len(formatted_results)} relevant documents")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching {self.tool_name}: {e}")
            return []
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the tool's data"""
        if not self.is_initialized:
            return {"initialized": False, "error": "Tool not initialized"}
        
        try:
            doc_count = 0
            if self.vector_store is not None:
                doc_count = int(self.vector_store.index.ntotal)  # Ensure integer type
            
            return {
                "initialized": True,
                "tool_name": self.tool_name,
                "document_count": doc_count,
                "vector_store_path": str(self.vector_store_dir)
            }
        except Exception as e:
            return {
                "initialized": True,
                "error": str(e)
            }
