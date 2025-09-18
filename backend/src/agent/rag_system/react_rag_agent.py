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
        """Search financial data (CSV tool) - Direct access to CSV functions"""
        logger.info(f"🔍 TOOL CALL: search_financial_data(query='{query}')")
        try:
            results = self.csv_tool.search_financial_data(query, k=5, score_threshold=0.3)
            logger.info(f"📊 TOOL RESULT: search_financial_data returned {len(results) if results else 0} results")
            
            if not results:
                logger.warning(f"⚠️ TOOL WARNING: No financial data found for query: '{query}'")
                return "No financial data found for this query. Try terms like 'cashflow summary', 'invoice overview', 'customers', 'suppliers', or 'financial overview'."
            
            formatted_results = []
            for i, result in enumerate(results[:3], 1):
                content = result.get('content', '')
                score = result.get('score', 0)
                # For direct CSV access, content is already well-formatted
                formatted_results.append(f"Financial Data Result {i} (confidence: {score:.2f}):\n{content}")
                logger.debug(f"📄 TOOL DETAIL: Result {i} - score: {score:.2f}, content length: {len(content)}")
            
            logger.info(f"✅ TOOL SUCCESS: search_financial_data returning {len(formatted_results)} formatted results")
            return "\n\n" + "\n\n---\n\n".join(formatted_results)
        except Exception as e:
            logger.error(f"❌ TOOL ERROR: search_financial_data failed - {str(e)}")
            return f"Error accessing financial data: {str(e)}"
    
    def search_ai_recommendations(self, query: str) -> str:
        """Search AI recommendations and market intelligence (SQL tool)"""
        logger.info(f"🔍 TOOL CALL: search_ai_recommendations(query='{query}')")
        try:
            results = self.sql_tool.search_ai_recommendations(query, k=5, score_threshold=0.3)
            logger.info(f"📊 TOOL RESULT: search_ai_recommendations returned {len(results) if results else 0} results")
            
            if not results:
                logger.warning(f"⚠️ TOOL WARNING: No AI recommendations found for query: '{query}'")
                return "No AI recommendations or market intelligence found. Try terms like 'market trends', 'analysis', 'recommendations', or 'insights'."
            
            formatted_results = []
            for i, result in enumerate(results[:3], 1):
                content = result.get('content', '')[:300]
                score = result.get('score', 0)
                formatted_results.append(f"Insight {i} (relevance: {score:.2f}):\n{content}")
                logger.debug(f"📄 TOOL DETAIL: AI Insight {i} - score: {score:.2f}, content length: {len(result.get('content', ''))}")
            
            logger.info(f"✅ TOOL SUCCESS: search_ai_recommendations returning {len(formatted_results)} formatted results")
            return f"Found {len(results)} AI insights:\n\n" + "\n\n".join(formatted_results)
        except Exception as e:
            logger.error(f"❌ TOOL ERROR: search_ai_recommendations failed - {str(e)}")
            return f"Error searching AI recommendations: {str(e)}"
    
    def search_business_knowledge(self, query: str) -> str:
        """Search general business knowledge (Document tool)"""
        logger.info(f"🔍 TOOL CALL: search_business_knowledge(query='{query}')")
        try:
            results = self.document_tool.search_documents(query, k=5, score_threshold=0.3)
            logger.info(f"📊 TOOL RESULT: search_business_knowledge returned {len(results) if results else 0} results")
            
            if not results:
                logger.warning(f"⚠️ TOOL WARNING: No business knowledge found for query: '{query}'")
                return "No business knowledge found. Try broader terms like 'business concepts', 'definitions', or 'procedures'."
            
            formatted_results = []
            for i, result in enumerate(results[:3], 1):
                content = result.get('content', '')[:300]
                score = result.get('score', 0)
                formatted_results.append(f"Knowledge {i} (relevance: {score:.2f}):\n{content}")
                logger.debug(f"📄 TOOL DETAIL: Knowledge {i} - score: {score:.2f}, content length: {len(result.get('content', ''))}")
            
            logger.info(f"✅ TOOL SUCCESS: search_business_knowledge returning {len(formatted_results)} formatted results")
            return f"Found {len(results)} business knowledge entries:\n\n" + "\n\n".join(formatted_results)
        except Exception as e:
            logger.error(f"❌ TOOL ERROR: search_business_knowledge failed - {str(e)}")
            return f"Error searching business knowledge: {str(e)}"
    
    def get_langchain_tools(self) -> List[Tool]:
        """Convert RAG tools to LangChain Tools for ReAct agent"""
        return [
            Tool(
                name="search_financial_data",
                description="Access financial data directly from CSV files including cashflow summaries, invoice records, customer/supplier information. Returns real-time calculated results for: cashflow analysis (income/expenses/net), invoice summaries (status/totals), contact information (customers/suppliers), and financial overviews. Use for any financial queries.",
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
            
            logger.info(f"🚀 REACT AGENT: Starting query processing - '{user_query}'")
            
            # Create system prompt and user message
            system_prompt = create_enhanced_system_prompt()
            
            # Invoke the ReAct agent with system context + user query
            enhanced_query = f"{system_prompt}\n\nUser Query: {user_query}"
            
            logger.info(f"🤖 REACT AGENT: Invoking agent with enhanced query (length: {len(enhanced_query)} chars)")
            
            result = self.agent.invoke(
                {"messages": [HumanMessage(content=enhanced_query)]},
                config=config
            )
            
            logger.info(f"🏁 REACT AGENT: Agent invocation completed")
            
            # Extract the final message
            messages = result.get("messages", [])
            logger.info(f"📨 REACT AGENT: Processing {len(messages)} messages from agent")
            
            # Log message types and tool calls
            for i, msg in enumerate(messages):
                msg_type = type(msg).__name__
                if hasattr(msg, 'tool_calls') and msg.tool_calls:
                    logger.info(f"🔧 REACT AGENT: Message {i+1} ({msg_type}) contains {len(msg.tool_calls)} tool calls")
                    for j, tool_call in enumerate(msg.tool_calls):
                        tool_name = getattr(tool_call, 'name', 'unknown')
                        tool_args = getattr(tool_call, 'args', {})
                        logger.info(f"  🛠️ Tool call {j+1}: {tool_name}({tool_args})")
                else:
                    content_preview = str(msg)[:100] + "..." if len(str(msg)) > 100 else str(msg)
                    logger.info(f"💬 REACT AGENT: Message {i+1} ({msg_type}): {content_preview}")
            
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
            total_tool_calls = sum(len(msg.tool_calls) for msg in tool_messages)
            confidence = min(0.9, 0.5 + len(tool_messages) * 0.1)
            
            logger.info(f"📊 REACT AGENT: Query analysis - {len(tool_messages)} tool messages, {total_tool_calls} total tool calls, confidence: {confidence:.2f}")
            logger.info(f"✅ REACT AGENT: Query completed successfully")
            
            return {
                "final_answer": final_answer,
                "confidence_score": confidence,
                "messages": messages,
                "tool_usage_count": total_tool_calls
            }
            
        except Exception as e:
            logger.error(f"❌ REACT AGENT ERROR: Failed to process query '{user_query}' - {str(e)}")
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
        logger.info("🏗️ GLOBAL INSTANCE: Creating new ReactRAGSystem instance")
        _react_rag_system = ReactRAGSystem()
        logger.info("✅ GLOBAL INSTANCE: ReactRAGSystem instance created and cached")
    else:
        logger.debug("♻️ GLOBAL INSTANCE: Returning cached ReactRAGSystem instance")
    return _react_rag_system

def _get_react_rag_system() -> ReactRAGSystem:
    """Get or create the global ReAct RAG system instance (for consistency with graph.py)"""
    return get_react_rag_system()

def _get_rag_tool_adapter() -> RAGToolAdapter:
    """Get or create the global RAG tool adapter instance for index rebuilding"""
    global _rag_tool_adapter
    if _rag_tool_adapter is None:
        logger.info("🏗️ GLOBAL INSTANCE: Creating new RAGToolAdapter instance")
        _rag_tool_adapter = RAGToolAdapter()
        logger.info("✅ GLOBAL INSTANCE: RAGToolAdapter instance created and cached")
    else:
        logger.debug("♻️ GLOBAL INSTANCE: Returning cached RAGToolAdapter instance")
    return _rag_tool_adapter

def rebuild_indexes(force_rebuild: bool = False) -> bool:
    """Rebuild all tool indexes"""
    try:
        logger.info(f"🔄 INDEX REBUILD: Starting index rebuild (force_rebuild={force_rebuild})")
        
        tool_adapter = _get_rag_tool_adapter()
        
        # Rebuild CSV tool index
        logger.info(f"🔄 INDEX REBUILD: Rebuilding CSV tool index...")
        csv_success = tool_adapter.csv_tool.initialize(force_rebuild=force_rebuild)
        logger.info(f"📊 INDEX REBUILD: CSV tool rebuild: {'✅ success' if csv_success else '❌ failed'}")
        
        # Rebuild SQL tool index  
        logger.info(f"🔄 INDEX REBUILD: Rebuilding SQL tool index...")
        sql_success = tool_adapter.sql_tool.initialize(force_rebuild=force_rebuild)
        logger.info(f"🗄️ INDEX REBUILD: SQL tool rebuild: {'✅ success' if sql_success else '❌ failed'}")
        
        # Rebuild Document tool index
        logger.info(f"🔄 INDEX REBUILD: Rebuilding Document tool index...")
        doc_success = tool_adapter.document_tool.initialize(force_rebuild=force_rebuild)
        logger.info(f"📄 INDEX REBUILD: Document tool rebuild: {'✅ success' if doc_success else '❌ failed'}")
        
        overall_success = csv_success and sql_success and doc_success
        logger.info(f"🏁 INDEX REBUILD: Overall index rebuild: {'✅ SUCCESS' if overall_success else '❌ FAILED'}")
        
        # Reset global instances to use new indexes
        global _react_rag_system, _rag_tool_adapter
        _react_rag_system = None
        _rag_tool_adapter = None
        logger.info(f"🔄 INDEX REBUILD: Global instances reset to use new indexes")
        
        return overall_success
        
    except Exception as e:
        logger.error(f"❌ INDEX REBUILD ERROR: Failed to rebuild indexes - {str(e)}")
        return False

def get_tool_stats() -> Dict[str, Any]:
    """Get statistics about all tools"""
    try:
        logger.info(f"📈 TOOL STATS: Gathering statistics for all tools")
        tool_adapter = _get_rag_tool_adapter()
        
        csv_stats = tool_adapter.csv_tool.get_stats()
        sql_stats = tool_adapter.sql_tool.get_stats()
        doc_stats = tool_adapter.document_tool.get_stats()
        
        logger.info(f"📊 TOOL STATS: CSV tool - {csv_stats}")
        logger.info(f"🗄️ TOOL STATS: SQL tool - {sql_stats}")
        logger.info(f"📄 TOOL STATS: Document tool - {doc_stats}")
        
        stats = {
            "csv_tool": csv_stats,
            "sql_tool": sql_stats, 
            "document_tool": doc_stats
        }
        
        logger.info(f"✅ TOOL STATS: Successfully gathered all tool statistics")
        return stats
    except Exception as e:
        logger.error(f"❌ TOOL STATS ERROR: Failed to get tool stats - {str(e)}")
        return {"error": str(e)}


# Create the graph
react_rag_graph = create_react_rag_graph()
