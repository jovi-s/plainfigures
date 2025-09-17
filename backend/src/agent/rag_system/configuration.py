"""
Configuration for the LangGraph RAG system
"""

from typing import Optional
from pydantic import BaseModel, Field
from langgraph.graph import MessagesState


class RAGConfiguration(BaseModel):
    """Configuration for RAG system"""
    
    # Models
    classification_model: str = Field(default="gpt-4o-mini", description="Model for query classification")
    answer_model: str = Field(default="gpt-4o-mini", description="Model for final answer generation")
    
    # Retrieval settings
    similarity_threshold: float = Field(default=0.5, description="Minimum similarity score for retrieval")
    max_documents_per_tool: int = Field(default=5, description="Maximum documents to retrieve per tool")
    
    # Vector store settings
    embedding_model: str = Field(default="text-embedding-3-small", description="OpenAI embedding model")
    vector_dimension: int = Field(default=1536, description="Embedding dimension")
    
    # Tool settings
    enable_csv_tool: bool = Field(default=True, description="Enable CSV data source tool")
    enable_sql_tool: bool = Field(default=True, description="Enable SQL database tool")
    enable_document_tool: bool = Field(default=True, description="Enable document (TXT/PDF) tool")
    
    # Answer generation settings
    include_sources: bool = Field(default=True, description="Include source references in answers")
    max_answer_length: int = Field(default=2000, description="Maximum answer length in characters")

    @classmethod
    def from_runnable_config(cls, config: Optional[dict] = None) -> "RAGConfiguration":
        """Create configuration from runnable config"""
        if config is None:
            return cls()
        
        configurable = config.get("configurable", {})
        return cls(**configurable)
