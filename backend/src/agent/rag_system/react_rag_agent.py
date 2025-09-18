"""
ReAct RAG Agent using LangGraph's built-in create_react_agent
"""

import os
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path

from langchain_openai import ChatOpenAI
from langchain_core.tools import Tool
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.prebuilt import create_react_agent
from langgraph.graph import StateGraph, START, END

from .state import RAGState
from .tools import CSVTool, SQLTool, DocumentTool

logger = logging.getLogger(__name__)


class RAGToolAdapter:
    """Adapter to convert RAG tools into LangChain Tools for ReAct agent"""
    
    def __init__(self):
        self.csv_tool = CSVTool()
        self.sql_tool = SQLTool()
        self.document_tool = DocumentTool()
        self._initialize_tools()
    
    def _initialize_tools(self):
        """Initialize all RAG tools"""
        try:
            self.csv_tool.initialize()
            self.sql_tool.initialize()
            self.document_tool.initialize()
            logger.info("RAG tools initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing RAG tools: {e}")
    
    def search_financial_data(self, query: str) -> str:
        """Search financial data (CSV tool)"""
        try:
            results = self.csv_tool.search_financial_data(query, k=5, score_threshold=0.3)
            if not results:
                return "No financial data found for this query. Try more specific terms like 'revenue', 'expenses', 'cashflow', or 'transactions'."
            
            formatted_results = []
            for i, result in enumerate(results[:3], 1):
                content = result.get('content', '')[:300]
                score = result.get('score', 0)
                formatted_results.append(f"Result {i} (relevance: {score:.2f}):\n{content}")
            
            return f"Found {len(results)} financial records:\n\n" + "\n\n".join(formatted_results)
        except Exception as e:
            return f"Error searching financial data: {str(e)}"
    
    def search_ai_recommendations(self, query: str) -> str:
        """Search AI recommendations and market intelligence (SQL tool)"""
        try:
            results = self.sql_tool.search_ai_recommendations(query, k=5, score_threshold=0.3)
            if not results:
                return "No AI recommendations or market intelligence found. Try terms like 'market trends', 'analysis', 'recommendations', or 'insights'."
            
            formatted_results = []
            for i, result in enumerate(results[:3], 1):
                content = result.get('content', '')[:300]
                score = result.get('score', 0)
                formatted_results.append(f"Insight {i} (relevance: {score:.2f}):\n{content}")
            
            return f"Found {len(results)} AI insights:\n\n" + "\n\n".join(formatted_results)
        except Exception as e:
            return f"Error searching AI recommendations: {str(e)}"
    
    def search_business_knowledge(self, query: str) -> str:
        """Search general business knowledge (Document tool)"""
        try:
            results = self.document_tool.search_documents(query, k=5, score_threshold=0.3)
            if not results:
                return "No business knowledge found. Try broader terms like 'business concepts', 'definitions', or 'procedures'."
            
            formatted_results = []
            for i, result in enumerate(results[:3], 1):
                content = result.get('content', '')[:300]
                score = result.get('score', 0)
                formatted_results.append(f"Knowledge {i} (relevance: {score:.2f}):\n{content}")
            
            return f"Found {len(results)} business knowledge entries:\n\n" + "\n\n".join(formatted_results)
        except Exception as e:
            return f"Error searching business knowledge: {str(e)}"
    
    def get_langchain_tools(self) -> List[Tool]:
        """Convert RAG tools to LangChain Tools for ReAct agent"""
        return [
            Tool(
                name="search_financial_data",
                description="Search for financial data including cashflow, revenue, expenses, transactions, invoices, and financial summaries. Use this for queries about money, payments, profit/loss, and financial performance.",
                func=self.search_financial_data
            ),
            Tool(
                name="search_ai_recommendations", 
                description="Search for AI-generated business recommendations, market trends, industry analysis, and strategic insights. Use this for queries about market conditions, business advice, and analytical insights.",
                func=self.search_ai_recommendations
            ),
            Tool(
                name="search_business_knowledge",
                description="Search for general business concepts, definitions, procedures, regulations, and how-to guides. Use this for queries about business terminology, processes, and general knowledge.",
                func=self.search_business_knowledge
            )
        ]


def create_enhanced_system_prompt() -> str:
    """Create system prompt for the ReAct RAG agent"""
    return """You are a business intelligence assistant that helps users analyze their business data and get insights.

You have access to three main data sources through tools:
1. Financial data (cashflow, revenue, expenses, transactions)
2. AI recommendations and market intelligence 
3. General business knowledge and concepts

For complex queries that require multiple types of data:
1. Break down the query into specific information needs
2. Use the appropriate tools to gather relevant data
3. Synthesize the information to provide comprehensive answers
4. Include specific data points and calculations when possible

For example, if asked about "profitability given cashflow and market trends":
1. Use search_financial_data to find cashflow information
2. Use search_ai_recommendations to find market trend analysis  
3. Combine both to calculate and explain profitability projections

Always:
- Be specific in your tool searches (use relevant keywords)
- Provide data-backed answers when possible
- Explain your reasoning and calculations
- Cite specific information from the search results
- If data is insufficient, clearly state what additional information would be needed"""


class ReactRAGSystem:
    """ReAct-based RAG system using LangGraph's built-in agent"""
    
    def __init__(self, data_dir: Optional[Path] = None):
        self.tool_adapter = RAGToolAdapter()
        self.tools = self.tool_adapter.get_langchain_tools()
        
        # Create the ReAct agent
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0.1
        )
        
        # Create system prompt
        system_prompt = create_enhanced_system_prompt()
        
        # Create the ReAct agent graph
        # Note: create_react_agent may not support custom system messages directly
        # Let's try without the system message first and add it through other means
        self.agent = create_react_agent(
            model=self.llm,
            tools=self.tools
        )
        
        logger.info("ReAct RAG System initialized with built-in agent")
    
    def query(self, user_query: str, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Query the ReAct RAG system"""
        try:
            # Set default config
            if config is None:
                config = {"recursion_limit": 10}
            
            logger.info(f"Processing query: {user_query}")
            
            # Create system prompt and user message
            system_prompt = create_enhanced_system_prompt()
            
            # Invoke the ReAct agent with system context + user query
            enhanced_query = f"{system_prompt}\n\nUser Query: {user_query}"
            
            result = self.agent.invoke(
                {"messages": [HumanMessage(content=enhanced_query)]},
                config=config
            )
            
            # Extract the final message
            messages = result.get("messages", [])
            if messages:
                final_message = messages[-1]
                if isinstance(final_message, AIMessage):
                    final_answer = final_message.content
                else:
                    final_answer = str(final_message)
            else:
                final_answer = "No response generated"
            
            # Calculate confidence based on tool usage
            tool_messages = [msg for msg in messages if hasattr(msg, 'tool_calls') and msg.tool_calls]
            confidence = min(0.9, 0.5 + len(tool_messages) * 0.1)
            
            logger.info(f"Query completed with confidence: {confidence}")
            
            return {
                "final_answer": final_answer,
                "confidence_score": confidence,
                "messages": messages,
                "tool_usage_count": len(tool_messages)
            }
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return {
                "final_answer": f"I encountered an error while processing your query: {str(e)}",
                "confidence_score": 0.1,
                "messages": [],
                "tool_usage_count": 0
            }


# Create a simple interface that matches the original system
def create_react_rag_graph():
    """Create a simple ReAct RAG graph that matches the original interface"""
    
    def process_query(state: RAGState) -> RAGState:
        """Process query using ReAct agent"""
        react_system = ReactRAGSystem()
        
        user_query = state.get("user_query", "")
        result = react_system.query(user_query)
        
        return {
            "final_answer": result["final_answer"],
            "confidence_score": result["confidence_score"],
            "messages": result["messages"],
            "sources": [],  # ReAct agent handles source attribution internally
            "tool_usage_count": result["tool_usage_count"]
        }
    
    # Create simple graph
    builder = StateGraph(RAGState)
    builder.add_node("process_query", process_query)
    builder.add_edge(START, "process_query")
    builder.add_edge("process_query", END)
    
    return builder.compile(name="react-rag-system")


# Global instances
_react_rag_system = None
_rag_tool_adapter = None

def get_react_rag_system() -> ReactRAGSystem:
    """Get or create global ReAct RAG system"""
    global _react_rag_system
    if _react_rag_system is None:
        _react_rag_system = ReactRAGSystem()
    return _react_rag_system

def _get_react_rag_system() -> ReactRAGSystem:
    """Get or create the global ReAct RAG system instance (for consistency with graph.py)"""
    return get_react_rag_system()

def _get_rag_tool_adapter() -> RAGToolAdapter:
    """Get or create the global RAG tool adapter instance for index rebuilding"""
    global _rag_tool_adapter
    if _rag_tool_adapter is None:
        _rag_tool_adapter = RAGToolAdapter()
    return _rag_tool_adapter

def rebuild_indexes(force_rebuild: bool = False) -> bool:
    """Rebuild all tool indexes"""
    try:
        logger.info(f"Starting index rebuild (force_rebuild={force_rebuild})")
        
        tool_adapter = _get_rag_tool_adapter()
        
        # Rebuild CSV tool index
        csv_success = tool_adapter.csv_tool.initialize(force_rebuild=force_rebuild)
        logger.info(f"CSV tool rebuild: {'success' if csv_success else 'failed'}")
        
        # Rebuild SQL tool index  
        sql_success = tool_adapter.sql_tool.initialize(force_rebuild=force_rebuild)
        logger.info(f"SQL tool rebuild: {'success' if sql_success else 'failed'}")
        
        # Rebuild Document tool index
        doc_success = tool_adapter.document_tool.initialize(force_rebuild=force_rebuild)
        logger.info(f"Document tool rebuild: {'success' if doc_success else 'failed'}")
        
        overall_success = csv_success and sql_success and doc_success
        logger.info(f"Overall index rebuild: {'success' if overall_success else 'failed'}")
        
        # Reset global instances to use new indexes
        global _react_rag_system, _rag_tool_adapter
        _react_rag_system = None
        _rag_tool_adapter = None
        
        return overall_success
        
    except Exception as e:
        logger.error(f"Error rebuilding indexes: {e}")
        return False

def get_tool_stats() -> Dict[str, Any]:
    """Get statistics about all tools"""
    try:
        tool_adapter = _get_rag_tool_adapter()
        
        return {
            "csv_tool": tool_adapter.csv_tool.get_stats(),
            "sql_tool": tool_adapter.sql_tool.get_stats(), 
            "document_tool": tool_adapter.document_tool.get_stats()
        }
    except Exception as e:
        logger.error(f"Error getting tool stats: {e}")
        return {"error": str(e)}


# Create the graph
react_rag_graph = create_react_rag_graph()
