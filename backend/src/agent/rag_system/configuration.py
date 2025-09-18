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
    reflection_model: str = Field(default="gpt-4o-mini", description="Model for reflection and multi-tool evaluation")
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
    
    # Reflection and multi-tool settings
    max_reflection_loops: int = Field(default=2, description="Maximum number of reflection iterations")
    enable_multi_tool: bool = Field(default=True, description="Enable multi-tool usage via reflection")
    
    # Reflective RAG settings
    enable_retrieval_decision: bool = Field(default=True, description="Enable retrieval necessity decision")
    enable_document_grading: bool = Field(default=True, description="Enable document relevance grading")
    enable_answer_assessment: bool = Field(default=True, description="Enable answer quality assessment")
    enable_corrective_loops: bool = Field(default=True, description="Enable corrective loops for poor answers")
    max_correction_loops: int = Field(default=2, description="Maximum number of correction iterations")
    document_relevance_threshold: float = Field(default=0.6, description="Minimum relevance score for documents")
    answer_quality_threshold: float = Field(default=0.7, description="Minimum quality score for answers")
    
    # ReAct Planning settings
    enable_query_planning: bool = Field(default=True, description="Enable ReAct-style query planning and decomposition")
    enable_multi_step_execution: bool = Field(default=True, description="Enable multi-step execution plans")
    enable_react_reasoning: bool = Field(default=True, description="Enable ReAct reasoning between steps")
    max_execution_steps: int = Field(default=5, description="Maximum number of execution steps in a plan")
    planning_model: str = Field(default="gpt-4o-mini", description="Model for query planning and decomposition")
    synthesis_model: str = Field(default="gpt-4o-mini", description="Model for multi-tool result synthesis")

    @classmethod
    def from_runnable_config(cls, config: Optional[dict] = None) -> "RAGConfiguration":
        """Create configuration from runnable config"""
        if config is None:
            return cls()
        
        configurable = config.get("configurable", {})
        return cls(**configurable)
