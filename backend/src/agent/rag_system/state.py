"""
State definitions for the LangGraph RAG system
"""

from typing import TypedDict, List, Dict, Any, Optional, Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class RAGState(TypedDict):
    """Main state for the RAG system"""
    messages: Annotated[List[BaseMessage], add_messages]
    user_query: str
    query_classification: Optional[str]  # 'financial_data', 'ai_recommendations', 'general_qa'
    retrieved_documents: List[Dict[str, Any]]
    tool_results: List[Dict[str, Any]]
    final_answer: Optional[str]
    sources: List[Dict[str, Any]]
    confidence_score: Optional[float]
    user_context: Optional[Dict[str, Any]]


class ToolState(TypedDict):
    """State for individual tool executions"""
    query: str
    tool_name: str
    results: List[Dict[str, Any]]
    success: bool
    error: Optional[str]


class ClassificationState(TypedDict):
    """State for query classification"""
    query: str
    classification: str
    confidence: float
    reasoning: str
