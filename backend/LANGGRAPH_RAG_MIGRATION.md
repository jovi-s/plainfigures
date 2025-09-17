# LangGraph RAG Migration Guide

## Overview

This guide describes the migration from LlamaIndex RAG to LangGraph RAG with data source tools. The new system provides better multi-agent orchestration, clearer separation between data sources, and improved query routing.

## Key Changes

### 1. Architecture
- **Old**: Single LlamaIndex RAG service with FAISS
- **New**: LangGraph multi-agent system with specialized data source tools

### 2. Data Sources as Tools
The system now treats each data source as a specialized tool:

1. **CSV Tool** (`csv_financial_data`)
   - Handles: Cashflow, invoices, financial transactions
   - Source: `cashflow.csv`, `invoice.csv`, `invoice_lines.csv`
   - Use case: "What is my profit this week?", "Show expense categories"

2. **SQL Tool** (`sql_ai_recommendations`) 
   - Handles: AI recommendations, market research, business insights
   - Source: `openai_recommendations`, `market_research`, `enhanced_recommendations` tables
   - Use case: "What business recommendations do you have?", "Show market insights"

3. **Document Tool** (`documents_general_qa`)
   - Handles: General Q&A, country-specific business info
   - Source: TXT files in `concepts/`, PDF files in `countries/`
   - Use case: "Business regulations in Singapore?", "How to expand to SEA?"

### 3. Query Classification
The system automatically classifies queries into:
- `financial_data` → Routes to CSV Tool
- `ai_recommendations` → Routes to SQL Tool  
- `general_qa` → Routes to Document Tool

## Migration Steps

### 1. Install Dependencies
```bash
# Already added to pyproject.toml:
# - langchain-community>=0.3.0
# - langchain-text-splitters>=0.3.0
```

### 2. Replace RAG Service Import
```python
# Old
from src.tools.rag_service import get_rag_service

# New  
from src.tools.langgraph_rag_service import get_langgraph_rag_service
```

### 3. Update Service Usage
```python
# Old
rag_service = get_rag_service()
result = rag_service.query("What is my profit?")

# New
rag_service = get_langgraph_rag_service()
result = rag_service.query("What is my profit?")
# Result format is the same!
```

## API Compatibility

The new service maintains the same interface:

```python
result = service.query(question, user_context=None)
# Returns:
{
    "success": bool,
    "response": str,
    "sources": List[Dict],
    "confidence": float,
    "classification": str,  # NEW: shows which tool was used
    "query_id": Optional[int]
}
```

## New Features

### 1. Tool-Specific Search
```python
# Search specific data sources directly
service.search_specific_tool("cashflow", "csv", k=5)
service.search_specific_tool("recommendations", "sql", k=3)
service.search_specific_tool("Singapore", "document", k=5)
```

### 2. Enhanced Statistics
```python
# Get detailed tool statistics
stats = service.get_tool_stats()
# Returns statistics for each tool's vector store
```

### 3. Selective Index Rebuilding
```python
# Rebuild all indexes
service.rebuild_indexes(force=True)
```

## Testing

Run the test suite to verify everything works:

```bash
cd backend
python examples/test_langgraph_rag.py
```

## Example Queries

### Financial Data (CSV Tool)
- "What is my profit this week?"
- "Summarize cash flow trends in the last 3 months"
- "Show me all expenses in the Office Supplies category"
- "What are my outstanding invoices?"

### AI Recommendations (SQL Tool)  
- "What business recommendations do you have for me?"
- "Show me recent market research insights"
- "Tell me about market opportunities in Southeast Asia"

### General Q&A (Document Tool)
- "What are the business regulations in Singapore?"
- "How do I expand my business to Southeast Asia?"
- "What are the tax requirements for SMEs?"

## File Structure

```
backend/src/agent/rag_system/
├── __init__.py
├── state.py              # Graph state definitions
├── configuration.py     # Configuration settings
├── prompts.py           # LLM prompts for each stage
├── graph.py             # Main LangGraph orchestrator
└── tools/
    ├── __init__.py
    ├── base_tool.py      # Base class for all tools
    ├── csv_tool.py       # Financial data (CSV) tool
    ├── sql_tool.py       # AI recommendations (SQL) tool
    └── document_tool.py  # General Q&A (TXT/PDF) tool
```

## Benefits

1. **Better Query Routing**: Automatically routes queries to the most relevant data source
2. **Specialized Processing**: Each tool optimized for its data type
3. **Multi-Agent Architecture**: Follows the project's multi-agent design principles
4. **Cleaner Separation**: Clear boundaries between data extraction and computation
5. **Extensible**: Easy to add new data sources as tools
6. **Better Performance**: Each tool has its own optimized vector store

## Troubleshooting

### Index Issues
If you get empty results, rebuild the indexes:
```python
service.rebuild_indexes(force=True)
```

### Classification Issues
Check the query classification:
```python
result = service.query("your question")
print(f"Classified as: {result['classification']}")
```

### Tool-Specific Issues
Test individual tools:
```python
# Test specific tools
csv_result = service.search_specific_tool("query", "csv")
sql_result = service.search_specific_tool("query", "sql") 
doc_result = service.search_specific_tool("query", "document")
```

## Performance Notes

- Each tool maintains its own FAISS vector store
- Vector stores are loaded lazily on first use
- Indexes are persistent and don't need rebuilding unless data changes
- The system can handle multiple concurrent queries efficiently
