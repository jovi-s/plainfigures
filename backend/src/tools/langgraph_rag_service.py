"""
LangGraph RAG Service - Replacement for LlamaIndex RAG service
Uses LangGraph with multiple data source tools and FAISS vector stores
"""

import os
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path

from langchain_core.messages import HumanMessage
from src.agent.rag_system.react_rag_agent import react_rag_graph, _get_react_rag_system
from src.agent.rag_system.state import RAGState
from src.utils.db import save_rag_query

logger = logging.getLogger(__name__)


class LangGraphRAGService:
    """LangGraph-based RAG service with data source tools"""
    
    def __init__(self):
        self.graph = react_rag_graph
        self.rag_system = _get_react_rag_system()
        logger.info("LangGraph RAG Service initialized")
    
    def query(self, question: str, user_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Query the LangGraph RAG system"""
        try:
            # Prepare initial state
            initial_state: RAGState = {
                "messages": [HumanMessage(content=question)],
                "user_query": question,
                "query_classification": None,
                "retrieved_documents": [],
                "tool_results": [],
                "final_answer": None,
                "sources": [],
                "confidence_score": None,
                "user_context": user_context
            }
            
            # Run the graph
            config = {
                "configurable": {
                    "similarity_threshold": 0.5,
                    "max_documents_per_tool": 5,
                    "include_sources": True
                }
            }
            
            result = self.graph.invoke(initial_state, config=config)
            
            # Extract results
            final_answer = result.get("final_answer", "I couldn't generate an answer.")
            sources = result.get("sources", [])
            confidence = result.get("confidence_score", 0.5)
            classification = result.get("query_classification", "unknown")
            
            # Save query to database
            try:
                save_rag_query(
                    query_text=question,
                    response_text=final_answer,
                    sources=sources,
                    user_context=user_context
                )
            except Exception as e:
                logger.error(f"Error saving query to database: {e}")
            
            return {
                "success": True,
                "response": final_answer,
                "sources": sources,
                "confidence": confidence,
                "classification": classification,
                "query_id": None  # Could be returned from save_rag_query
            }
            
        except Exception as e:
            logger.error(f"Error in LangGraph RAG query: {e}")
            return {
                "success": False,
                "error": str(e),
                "response": "I encountered an error while processing your question. Please try again."
            }
    
    def rebuild_indexes(self, force: bool = False) -> Dict[str, Any]:
        """Rebuild all vector indexes"""
        try:
            results = {}
            
            # Rebuild CSV tool index
            logger.info("Rebuilding CSV tool index...")
            csv_success = self.rag_system.csv_tool.initialize(force_rebuild=force)
            results["csv_tool"] = {"success": csv_success}
            
            # Rebuild SQL tool index
            logger.info("Rebuilding SQL tool index...")
            sql_success = self.rag_system.sql_tool.initialize(force_rebuild=force)
            results["sql_tool"] = {"success": sql_success}
            
            # Rebuild Document tool index
            logger.info("Rebuilding Document tool index...")
            doc_success = self.rag_system.document_tool.initialize(force_rebuild=force)
            results["document_tool"] = {"success": doc_success}
            
            overall_success = csv_success and sql_success and doc_success
            
            return {
                "success": overall_success,
                "results": results,
                "message": "Index rebuild completed" if overall_success else "Some indexes failed to rebuild"
            }
            
        except Exception as e:
            logger.error(f"Error rebuilding indexes: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Index rebuild failed"
            }
    
    def get_tool_stats(self) -> Dict[str, Any]:
        """Get statistics for all tools"""
        try:
            return {
                "csv_tool": self.rag_system.csv_tool.get_stats(),
                "sql_tool": self.rag_system.sql_tool.get_stats(),
                "document_tool": self.rag_system.document_tool.get_stats()
            }
        except Exception as e:
            logger.error(f"Error getting tool stats: {e}")
            return {"error": str(e)}
    
    def search_specific_tool(self, query: str, tool_name: str, **kwargs) -> Dict[str, Any]:
        """Search using a specific tool"""
        try:
            if tool_name == "csv":
                results = self.rag_system.csv_tool.search_financial_data(query, **kwargs)
            elif tool_name == "sql":
                results = self.rag_system.sql_tool.search_ai_recommendations(query, **kwargs)
            elif tool_name == "document":
                results = self.rag_system.document_tool.search_documents(query, **kwargs)
            else:
                return {
                    "success": False,
                    "error": f"Unknown tool: {tool_name}",
                    "results": []
                }
            
            return {
                "success": True,
                "tool_name": tool_name,
                "results": results,
                "count": len(results)
            }
            
        except Exception as e:
            logger.error(f"Error searching with tool {tool_name}: {e}")
            return {
                "success": False,
                "error": str(e),
                "results": []
            }
    
    def get_document_stats(self) -> Dict[str, Any]:
        """Get document statistics (for compatibility with old interface)"""
        try:
            stats = self.get_tool_stats()
            
            total_docs = 0
            for tool_stats in stats.values():
                if isinstance(tool_stats, dict) and "document_count" in tool_stats:
                    total_docs += tool_stats["document_count"]
            
            return {
                "total_documents": total_docs,
                "tool_statistics": stats,
                "system": "LangGraph RAG with FAISS"
            }
            
        except Exception as e:
            logger.error(f"Error getting document stats: {e}")
            return {"error": str(e)}


# Global service instance
_langgraph_rag_service = None

def get_langgraph_rag_service() -> LangGraphRAGService:
    """Get or create the global LangGraph RAG service instance"""
    global _langgraph_rag_service
    if _langgraph_rag_service is None:
        _langgraph_rag_service = LangGraphRAGService()
    return _langgraph_rag_service
