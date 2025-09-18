"""
Document Tool for TXT and PDF files for general Q&A
"""

import logging
from typing import List, Dict, Any
from pathlib import Path

import fitz  # PyMuPDF for better text extraction
from langchain_core.documents import Document
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .base_tool import BaseRAGTool

logger = logging.getLogger(__name__)


class DocumentTool(BaseRAGTool):
    """Tool for accessing TXT and PDF documents with FAISS vector search"""
    
    def __init__(self, data_dir: Path = None):
        super().__init__("documents_general_qa", data_dir)
        
        # Document directories
        self.concepts_dir = self.data_dir / "concepts"
        self.countries_dir = self.data_dir / "countries"
        
        # Text splitter for chunking
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
    
    def load_documents(self) -> List[Document]:
        """Load TXT and PDF documents"""
        documents = []
        
        # Load text files from concepts directory
        documents.extend(self._load_text_files())
        
        # Load PDF files from countries directory
        documents.extend(self._load_pdf_files())
        
        return documents
    
    def _load_text_files(self) -> List[Document]:
        """Load text files from concepts directory"""
        documents = []
        
        if not self.concepts_dir.exists():
            logger.warning(f"Concepts directory not found: {self.concepts_dir}")
            return documents
        
        for txt_file in self.concepts_dir.glob("*.txt"):
            try:
                with open(txt_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if not content.strip():
                    logger.warning(f"Empty text file: {txt_file.name}")
                    continue
                
                # Create a main document
                main_doc = Document(
                    page_content=content,
                    metadata={
                        "filename": txt_file.name,
                        "file_path": str(txt_file),
                        "content_type": "text/plain",
                        "source": "concepts",
                        "document_type": "full_document",
                        "data_category": "general_qa"
                    }
                )
                
                # Split into chunks for better retrieval
                chunks = self.text_splitter.split_documents([main_doc])
                
                # Update chunk metadata
                for i, chunk in enumerate(chunks):
                    chunk.metadata.update({
                        "chunk_index": i,
                        "total_chunks": len(chunks),
                        "document_type": "chunk"
                    })
                
                documents.extend(chunks)
                logger.info(f"Loaded text document: {txt_file.name} ({len(chunks)} chunks)")
                
            except Exception as e:
                logger.error(f"Error loading text file {txt_file}: {e}")
        
        return documents
    
    def _load_pdf_files(self) -> List[Document]:
        """Load PDF files from countries directory"""
        documents = []
        
        if not self.countries_dir.exists():
            logger.warning(f"Countries directory not found: {self.countries_dir}")
            return documents
        
        for pdf_file in self.countries_dir.rglob("*.pdf"):
            try:
                logger.info(f"Processing PDF: {pdf_file.name}")
                
                # Check if PDF is readable first
                if not self._is_readable_pdf(pdf_file):
                    logger.warning(f"Skipping unreadable PDF: {pdf_file.name} (likely image-based/scanned)")
                    continue
                
                # Extract text using PyMuPDF
                pdf_docs = self._extract_pdf_content(pdf_file)
                documents.extend(pdf_docs)
                
                logger.info(f"Loaded PDF document: {pdf_file.name} ({len(pdf_docs)} chunks)")
                
            except Exception as e:
                logger.error(f"Error loading PDF {pdf_file}: {e}")
        
        return documents
    
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
            
            # Check if we have substantial readable text
            readable_chars = sum(1 for c in total_text if c.isalnum() or c.isspace())
            total_chars = len(total_text)
            
            # If less than 20% of characters are readable, consider it unreadable
            readability_ratio = readable_chars / total_chars if total_chars > 0 else 0
            
            logger.debug(f"PDF {pdf_path.name}: {readable_chars}/{total_chars} readable chars ({readability_ratio:.2%})")
            
            return readability_ratio > 0.2
            
        except Exception as e:
            logger.error(f"Error checking PDF readability {pdf_path}: {e}")
            return False
    
    def _extract_pdf_content(self, pdf_path: Path) -> List[Document]:
        """Extract content from PDF file"""
        documents = []
        
        try:
            doc = fitz.open(pdf_path)
            
            # Extract text from each page
            full_text = ""
            page_contents = []
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                page_text = page.get_text()
                
                if page_text.strip():  # Only add non-empty pages
                    page_contents.append({
                        "page_number": page_num + 1,
                        "content": page_text
                    })
                    full_text += f"\n\n--- Page {page_num + 1} ---\n\n{page_text}"
            
            doc.close()
            
            if not full_text.strip():
                logger.warning(f"No text content found in PDF: {pdf_path.name}")
                return documents
            
            # Create main document
            main_doc = Document(
                page_content=full_text,
                metadata={
                    "filename": pdf_path.name,
                    "file_path": str(pdf_path),
                    "content_type": "application/pdf",
                    "source": "countries",
                    "country": pdf_path.parent.name,
                    "document_type": "full_document",
                    "data_category": "general_qa",
                    "total_pages": len(page_contents)
                }
            )
            
            # Split into chunks
            chunks = self.text_splitter.split_documents([main_doc])
            
            # Update chunk metadata and try to identify which page each chunk came from
            for i, chunk in enumerate(chunks):
                # Try to identify the page for this chunk
                page_info = self._identify_chunk_page(chunk.page_content, page_contents)
                
                chunk.metadata.update({
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "document_type": "chunk",
                    **page_info
                })
            
            documents.extend(chunks)
            
            # Also create page-level documents for more precise retrieval
            page_docs = self._create_page_documents(pdf_path, page_contents)
            documents.extend(page_docs)
            
        except Exception as e:
            logger.error(f"Error extracting PDF content from {pdf_path}: {e}")
        
        return documents
    
    def _identify_chunk_page(self, chunk_content: str, page_contents: List[Dict]) -> Dict[str, Any]:
        """Try to identify which page a chunk belongs to"""
        # Simple heuristic: find the page with the highest overlap
        best_page = None
        best_overlap = 0
        
        for page_info in page_contents:
            page_text = page_info["content"]
            
            # Calculate rough overlap by checking how much of the chunk appears in the page
            chunk_words = set(chunk_content.lower().split())
            page_words = set(page_text.lower().split())
            
            if chunk_words and page_words:
                overlap = len(chunk_words.intersection(page_words)) / len(chunk_words)
                if overlap > best_overlap:
                    best_overlap = overlap
                    best_page = page_info["page_number"]
        
        if best_page and best_overlap > 0.3:  # At least 30% overlap
            return {
                "page_number": best_page,
                "page_confidence": best_overlap
            }
        else:
            return {}
    
    def _create_page_documents(self, pdf_path: Path, page_contents: List[Dict]) -> List[Document]:
        """Create individual documents for each PDF page"""
        documents = []
        
        for page_info in page_contents:
            page_doc = Document(
                page_content=page_info["content"],
                metadata={
                    "filename": pdf_path.name,
                    "file_path": str(pdf_path),
                    "content_type": "application/pdf",
                    "source": "countries",
                    "country": pdf_path.parent.name,
                    "document_type": "page",
                    "data_category": "general_qa",
                    "page_number": page_info["page_number"],
                    "total_pages": len(page_contents)
                }
            )
            documents.append(page_doc)
        
        return documents
    
    def search_documents(self, query: str, source: str = None, country: str = None, k: int = 5, score_threshold: float = 0.3) -> List[Dict[str, Any]]:
        """Search documents with optional filtering"""
        results = self.search(query, k=k * 2, score_threshold=score_threshold)  # Get more results for filtering
        
        filtered_results = results
        
        if source:
            filtered_results = [
                result for result in filtered_results 
                if result.get("metadata", {}).get("source") == source
            ]
        
        if country:
            filtered_results = [
                result for result in filtered_results 
                if result.get("metadata", {}).get("country") == country
            ]
        
        return filtered_results[:k]
    
    def search_by_country(self, query: str, country: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search documents specifically for a country"""
        return self.search_documents(query, source="countries", country=country, k=k)
    
    def search_concepts(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search concept documents"""
        return self.search_documents(query, source="concepts", k=k)
