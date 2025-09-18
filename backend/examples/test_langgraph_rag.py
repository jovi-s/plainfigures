"""
Test script for the new LangGraph RAG system
Demonstrates how to use the data sources as tools for different types of queries
"""

import os
import sys
import logging
from pathlib import Path

# Add the backend src to path
backend_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(backend_path))

from tools.langgraph_rag_service import get_langgraph_rag_service


def setup_logging():
    """Setup logging for the test"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )


def test_financial_data_queries():
    """Test queries that should use the CSV financial data tool"""
    print("\n" + "="*80)
    print("TESTING FINANCIAL DATA QUERIES")
    print("="*80)
    
    service = get_langgraph_rag_service()
    
    # Test queries for financial data
    financial_queries = [
        "What is my profit this week?",
        "Summarize cash flow trends in the last 3 months", 
        "Show me all expenses in the Office Supplies category",
        "What are my outstanding invoices?",
        "How much revenue did I generate from sales?",
        "Which customers owe me money?",
        "What are my biggest expense categories?",
        "Show me all transactions in SGD currency"
    ]
    
    for i, query in enumerate(financial_queries, 1):
        print(f"\n{i}. Query: {query}")
        print("-" * 60)
        
        result = service.query(query)
        
        print(f"Success: {result['success']}")
        print(f"Classification: {result.get('classification', 'N/A')}")
        print(f"Confidence: {result.get('confidence', 'N/A'):.2f}")
        print(f"Sources: {len(result.get('sources', []))}")
        
        if result['success']:
            response = result['response']
            print(f"Response Preview: {response[:200]}...")
        else:
            print(f"Error: {result.get('error', 'Unknown error')}")


def test_ai_recommendations_queries():
    """Test queries that should use the SQL AI recommendations tool"""
    print("\n" + "="*80)
    print("TESTING AI RECOMMENDATIONS QUERIES")
    print("="*80)
    
    service = get_langgraph_rag_service()
    
    # Test queries for AI recommendations
    ai_queries = [
        "What business recommendations do you have for me?",
        "Show me recent market research insights",
        "What are the latest AI-generated business advice?",
        "Tell me about market opportunities in Southeast Asia",
        "What strategic recommendations were made recently?",
        "Show me enhanced business recommendations",
        "What market research has been done?",
        "Give me AI insights about my business"
    ]
    
    for i, query in enumerate(ai_queries, 1):
        print(f"\n{i}. Query: {query}")
        print("-" * 60)
        
        result = service.query(query)
        
        print(f"Success: {result['success']}")
        print(f"Classification: {result.get('classification', 'N/A')}")
        print(f"Confidence: {result.get('confidence', 'N/A'):.2f}")
        print(f"Sources: {len(result.get('sources', []))}")
        
        if result['success']:
            response = result['response']
            print(f"Response Preview: {response[:200]}...")
        else:
            print(f"Error: {result.get('error', 'Unknown error')}")


def test_general_qa_queries():
    """Test queries that should use the TXT/PDF document tool"""
    print("\n" + "="*80)
    print("TESTING GENERAL Q&A QUERIES")
    print("="*80)
    
    service = get_langgraph_rag_service()
    
    # Test queries for general Q&A
    qa_queries = [
        "What are the business regulations in Singapore?",
        "How do I expand my business to Southeast Asia?",
        "What are the tax requirements for SMEs?",
        "Tell me about doing business in Indonesia",
        "What is the accountancy industry like in Singapore?",
        "How to start a business in Cambodia?",
        "What are the compliance requirements in Malaysia?",
        "Give me information about business expansion guide"
    ]
    
    for i, query in enumerate(qa_queries, 1):
        print(f"\n{i}. Query: {query}")
        print("-" * 60)
        
        result = service.query(query)
        
        print(f"Success: {result['success']}")
        print(f"Classification: {result.get('classification', 'N/A')}")
        print(f"Confidence: {result.get('confidence', 'N/A'):.2f}")
        print(f"Sources: {len(result.get('sources', []))}")
        
        if result['success']:
            response = result['response']
            print(f"Response Preview: {response[:200]}...")
        else:
            print(f"Error: {result.get('error', 'Unknown error')}")


def test_tool_specific_searches():
    """Test searching specific tools directly"""
    print("\n" + "="*80)
    print("TESTING TOOL-SPECIFIC SEARCHES")
    print("="*80)
    
    service = get_langgraph_rag_service()
    
    # Test CSV tool specifically
    print("\n1. Testing CSV tool with financial query:")
    csv_result = service.search_specific_tool("cashflow transactions", "csv", k=3)
    print(f"CSV Tool Results: {csv_result['count'] if csv_result['success'] else 'Error'}")
    
    # Test SQL tool specifically
    print("\n2. Testing SQL tool with recommendations query:")
    sql_result = service.search_specific_tool("business recommendations", "sql", k=3)
    print(f"SQL Tool Results: {sql_result['count'] if sql_result['success'] else 'Error'}")
    
    # Test Document tool specifically
    print("\n3. Testing Document tool with country query:")
    doc_result = service.search_specific_tool("Singapore business", "document", k=3)
    print(f"Document Tool Results: {doc_result['count'] if doc_result['success'] else 'Error'}")


def test_system_statistics():
    """Test getting system and tool statistics"""
    print("\n" + "="*80)
    print("TESTING SYSTEM STATISTICS")
    print("="*80)
    
    service = get_langgraph_rag_service()
    
    # Get tool statistics
    print("\n1. Tool Statistics:")
    tool_stats = service.get_tool_stats()
    for tool_name, stats in tool_stats.items():
        print(f"  {tool_name}: {stats}")
    
    # Get document statistics (compatibility)
    print("\n2. Document Statistics:")
    doc_stats = service.get_document_stats()
    print(f"  Total Documents: {doc_stats.get('total_documents', 'N/A')}")
    print(f"  System: {doc_stats.get('system', 'N/A')}")


def rebuild_indexes():
    """Test rebuilding indexes"""
    print("\n" + "="*80)
    print("REBUILDING INDEXES")
    print("="*80)
    
    service = get_langgraph_rag_service()
    
    print("Rebuilding all indexes...")
    result = service.rebuild_indexes(force=False)
    
    print(f"Success: {result['success']}")
    print(f"Message: {result['message']}")
    
    for tool, tool_result in result.get('results', {}).items():
        print(f"  {tool}: {'Success' if tool_result['success'] else 'Failed'}")


def main():
    """Main test function"""
    setup_logging()
    
    print("LangGraph RAG System Test Suite")
    print("Testing the conversion from LlamaIndex to LangGraph with data source tools")
    
    try:
        # Test different query types
        test_financial_data_queries()
        test_ai_recommendations_queries()
        test_general_qa_queries()
        
        # Test tool-specific searches
        test_tool_specific_searches()
        
        # Test system statistics
        test_system_statistics()
        
        # Option to rebuild indexes
        rebuild_choice = input("\nDo you want to rebuild indexes? (y/N): ")
        if rebuild_choice.lower() == 'y':
            rebuild_indexes()
        
        print("\n" + "="*80)
        print("TEST SUITE COMPLETED")
        print("="*80)
        print("\nThe LangGraph RAG system is now ready!")
        print("You can use it by calling get_langgraph_rag_service().query(your_question)")
        
    except Exception as e:
        print(f"\nError during testing: {e}")
        logging.exception("Test suite failed")


if __name__ == "__main__":
    main()
