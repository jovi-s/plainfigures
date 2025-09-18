"""
State definitions for the ReAct RAG system
"""

from typing import TypedDict, List, Dict, Any, Optional, Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class RAGState(TypedDict):
    """Minimal state for ReAct RAG system"""
    messages: Annotated[List[BaseMessage], add_messages]
    user_query: str
    final_answer: Optional[str]
    sources: List[Dict[str, Any]]
    confidence_score: Optional[float]
    tool_usage_count: Optional[int]
