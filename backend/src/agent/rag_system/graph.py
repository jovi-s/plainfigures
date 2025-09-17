"""
LangGraph RAG System with Data Source Tools
"""

import os
import logging
from typing import Dict, Any, List, Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send

from .state import RAGState, ToolState, ClassificationState
from .configuration import RAGConfiguration
from .tools import CSVTool, SQLTool, DocumentTool
from .prompts import (
    QUERY_CLASSIFICATION_PROMPT,
    FINANCIAL_ANALYSIS_PROMPT,
    AI_RECOMMENDATIONS_PROMPT,
    GENERAL_QA_PROMPT,
    FINAL_ANSWER_PROMPT
)

logger = logging.getLogger(__name__)


class RAGSystem:
    """LangGraph RAG System with multiple data source tools"""
    
    def __init__(self, data_dir: Optional[str] = None):
        # Initialize tools
        self.csv_tool = CSVTool()
        self.sql_tool = SQLTool()
        self.document_tool = DocumentTool()
        
        # Initialize tools
        self._initialize_tools()
        
        logger.info("RAG System initialized with all tools")
    
    def _initialize_tools(self):
        """Initialize all data source tools"""
        try:
            logger.info("Initializing CSV tool...")
            self.csv_tool.initialize()
            
            logger.info("Initializing SQL tool...")
            self.sql_tool.initialize()
            
            logger.info("Initializing Document tool...")
            self.document_tool.initialize()
            
            logger.info("All tools initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing tools: {e}")


# Graph Nodes
def classify_query(state: RAGState, config: RunnableConfig) -> ClassificationState:
    """Classify the user query to determine which tools to use"""
    configuration = RAGConfiguration.from_runnable_config(config)
    
    llm = ChatOpenAI(
        model=configuration.classification_model,
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0.1
    )
    
    query = state["user_query"]
    prompt = QUERY_CLASSIFICATION_PROMPT.format(query=query)
    
    response = llm.invoke([HumanMessage(content=prompt)])
    response_text = response.content
    
    # Parse the response
    lines = response_text.strip().split('\n')
    classification = "general_qa"  # default
    confidence = 0.5
    reasoning = "Default classification"
    
    for line in lines:
        if line.startswith("Category:"):
            classification = line.split(":", 1)[1].strip()
        elif line.startswith("Confidence:"):
            try:
                confidence = float(line.split(":", 1)[1].strip())
            except ValueError:
                confidence = 0.5
        elif line.startswith("Reasoning:"):
            reasoning = line.split(":", 1)[1].strip()
    
    logger.info(f"Query classified as: {classification} (confidence: {confidence})")
    
    return {
        "query_classification": classification,
        "user_query": query,
        "confidence_score": confidence
    }


def route_to_tools(state: RAGState) -> List[Send]:
    """Route the query to appropriate tools based on classification"""
    classification = state["query_classification"]
    query = state["user_query"]
    
    tools_to_use = []
    
    if classification == "financial_data":
        tools_to_use = ["csv_tool"]
    elif classification == "ai_recommendations":
        tools_to_use = ["sql_tool"]
    elif classification == "general_qa":
        tools_to_use = ["document_tool"]
    else:
        # Default: try multiple tools
        tools_to_use = ["csv_tool", "sql_tool", "document_tool"]
    
    logger.info(f"Routing to tools: {tools_to_use}")
    
    return [
        Send("execute_tool", {"query": query, "tool_name": tool_name})
        for tool_name in tools_to_use
    ]


def execute_tool(state: ToolState, config: RunnableConfig) -> RAGState:
    """Execute a specific tool to retrieve relevant documents"""
    configuration = RAGConfiguration.from_runnable_config(config)
    
    query = state["query"]
    tool_name = state["tool_name"]
    
    # Get the global RAG system instance
    rag_system = _get_rag_system()
    
    try:
        logger.info(f"Executing {tool_name} with query: '{query}' and threshold: {configuration.similarity_threshold}")
        
        if tool_name == "csv_tool":
            results = rag_system.csv_tool.search_financial_data(
                query, k=configuration.max_documents_per_tool, score_threshold=configuration.similarity_threshold
            )
        elif tool_name == "sql_tool":
            results = rag_system.sql_tool.search_ai_recommendations(
                query, k=configuration.max_documents_per_tool, score_threshold=configuration.similarity_threshold
            )
        elif tool_name == "document_tool":
            results = rag_system.document_tool.search_documents(
                query, k=configuration.max_documents_per_tool, score_threshold=configuration.similarity_threshold
            )
        else:
            logger.error(f"Unknown tool: {tool_name}")
            results = []
        
        logger.info(f"Tool {tool_name} returned {len(results)} results")
        
        # Debug: show first result if available
        if results:
            first_result = results[0]
            logger.info(f"First result from {tool_name}: score={first_result.get('score', 'N/A')}, content preview='{first_result.get('content', '')[:100]}...'")
        else:
            logger.warning(f"No results returned from {tool_name} for query '{query}'")
        
        return {
            "tool_results": [{
                "tool_name": tool_name,
                "results": results,
                "success": True,
                "query": query
            }]
        }
        
    except Exception as e:
        logger.error(f"Error executing tool {tool_name}: {e}")
        return {
            "tool_results": [{
                "tool_name": tool_name,
                "results": [],
                "success": False,
                "error": str(e),
                "query": query
            }]
        }


def generate_answer(state: RAGState, config: RunnableConfig) -> RAGState:
    """Generate the final answer based on retrieved information"""
    configuration = RAGConfiguration.from_runnable_config(config)
    
    llm = ChatOpenAI(
        model=configuration.answer_model,
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0.1
    )
    
    query = state["user_query"]
    classification = state["query_classification"]
    tool_results = state.get("tool_results", [])
    
    # Format retrieved data
    retrieved_data = ""
    sources = []
    
    for tool_result in tool_results:
        if tool_result["success"] and tool_result["results"]:
            tool_name = tool_result["tool_name"]
            retrieved_data += f"\n## From {tool_name}:\n"
            
            for i, result in enumerate(tool_result["results"][:5]):  # Limit results
                content = result["content"]
                metadata = result.get("metadata", {})
                score = result.get("score", 0)
                
                retrieved_data += f"\n### Result {i+1} (relevance: {score:.2f}):\n"
                retrieved_data += f"{content}\n"
                
                # Add to sources
                sources.append({
                    "tool_name": tool_name,
                    "content_preview": content[:200] + "..." if len(content) > 200 else content,
                    "metadata": metadata,
                    "score": score
                })
    
    if not retrieved_data.strip():
        return {
            "final_answer": "I couldn't find relevant information to answer your question. Please try rephrasing your query or contact support for assistance.",
            "sources": [],
            "confidence_score": 0.0
        }
    
    # Choose appropriate prompt based on classification
    if classification == "financial_data":
        prompt_template = FINANCIAL_ANALYSIS_PROMPT
    elif classification == "ai_recommendations":
        prompt_template = AI_RECOMMENDATIONS_PROMPT
    elif classification == "general_qa":
        prompt_template = GENERAL_QA_PROMPT
    else:
        prompt_template = FINAL_ANSWER_PROMPT.replace("{tool_results}", "{retrieved_data}")
    
    prompt = prompt_template.format(
        query=query,
        retrieved_data=retrieved_data
    )
    
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        final_answer = response.content
        
        # Calculate confidence based on tool results
        total_results = sum(len(tr["results"]) for tr in tool_results if tr["success"])
        confidence = min(0.9, 0.3 + (total_results * 0.1))  # Base confidence + results bonus
        
        logger.info(f"Generated answer with confidence: {confidence}")
        
        return {
            "final_answer": final_answer,
            "sources": sources,
            "confidence_score": confidence,
            "messages": [AIMessage(content=final_answer)]
        }
        
    except Exception as e:
        logger.error(f"Error generating answer: {e}")
        return {
            "final_answer": f"I encountered an error while generating the answer: {str(e)}",
            "sources": sources,
            "confidence_score": 0.1
        }


# Global RAG system instance
_rag_system_instance = None

def _get_rag_system() -> RAGSystem:
    """Get or create the global RAG system instance"""
    global _rag_system_instance
    if _rag_system_instance is None:
        _rag_system_instance = RAGSystem()
    return _rag_system_instance


# Create the RAG Graph
def create_rag_graph() -> StateGraph:
    """Create the LangGraph RAG system"""
    
    builder = StateGraph(RAGState, config_schema=RAGConfiguration)
    
    # Add nodes
    builder.add_node("classify_query", classify_query)
    builder.add_node("execute_tool", execute_tool)
    builder.add_node("generate_answer", generate_answer)
    
    # Add edges
    builder.add_edge(START, "classify_query")
    builder.add_conditional_edges(
        "classify_query",
        route_to_tools,
        ["execute_tool"]
    )
    builder.add_edge("execute_tool", "generate_answer")
    builder.add_edge("generate_answer", END)
    
    return builder.compile(name="rag-system")


# Create the compiled graph
rag_graph = create_rag_graph()
