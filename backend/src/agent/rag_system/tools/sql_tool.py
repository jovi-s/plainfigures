"""
SQL Database Tool for AI recommendations
"""

import json
import sqlite3
import logging
from typing import List, Dict, Any
from pathlib import Path

from langchain_core.documents import Document
from .base_tool import BaseRAGTool

logger = logging.getLogger(__name__)


class SQLTool(BaseRAGTool):
    """Tool for accessing SQL database AI recommendations with FAISS vector search"""
    
    def __init__(self, data_dir: Path = None):
        super().__init__("sql_ai_recommendations", data_dir)
        
        # Define tables to process
        self.tables_config = {
            "openai_recommendations": {
                "description": "AI-generated business recommendations",
                "content_fields": ["data_json", "user_context"],
                "metadata_fields": ["created_at", "cache_key"]
            },
            "market_research": {
                "description": "Market research analysis and insights",
                "content_fields": ["output_text", "prompt_context"],
                "metadata_fields": ["created_at", "cache_key"]
            },
            "enhanced_recommendations": {
                "description": "Enhanced business recommendations with market context",
                "content_fields": ["data_json", "user_context"],
                "metadata_fields": ["created_at", "cache_key", "market_hash"]
            }
        }
    
    def load_documents(self) -> List[Document]:
        """Load database tables as documents"""
        documents = []
        
        try:
            # Connect to the database
            db_path = self.data_dir / "memory.db"
            if not db_path.exists():
                logger.warning("Database file memory.db not found")
                return documents
            
            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            
            for table_name, config in self.tables_config.items():
                try:
                    cursor = conn.cursor()
                    cursor.execute(f"SELECT * FROM {table_name} ORDER BY created_at DESC LIMIT 10")
                    rows = cursor.fetchall()
                    
                    if not rows:
                        logger.warning(f"Table {table_name} is empty")
                        continue
                    
                    # Create documents for different granularities
                    
                    # 1. Table summary document
                    summary_doc = self._create_table_summary_document(table_name, config, rows)
                    documents.append(summary_doc)
                    
                    # 2. Individual record documents
                    record_docs = self._create_record_documents(table_name, config, rows)
                    documents.extend(record_docs)
                    
                    # 3. Aggregated documents by time period
                    agg_docs = self._create_time_aggregated_documents(table_name, config, rows)
                    documents.extend(agg_docs)
                    
                    logger.info(f"Loaded {len(record_docs) + len(agg_docs) + 1} documents from table {table_name}")
                    
                except Exception as e:
                    logger.error(f"Error loading table {table_name}: {e}")
            
            conn.close()
            
        except Exception as e:
            logger.error(f"Error connecting to database: {e}")
        
        return documents
    
    def _create_table_summary_document(self, table_name: str, config: Dict, rows: List) -> Document:
        """Create a summary document for the entire table"""
        content_lines = [f"# {table_name.replace('_', ' ').title()}"]
        content_lines.append(f"Description: {config['description']}")
        content_lines.append(f"Total records: {len(rows)}")
        content_lines.append("")
        
        # Add table schema information
        if rows:
            sample_row = dict(rows[0])
            content_lines.append("## Available Fields:")
            for field in sample_row.keys():
                content_lines.append(f"- {field}")
            content_lines.append("")
        
        # Add recent activity summary
        content_lines.append("## Recent Activity:")
        recent_records = rows[:5]  # Last 5 records
        for i, row in enumerate(recent_records):
            row_dict = dict(row)
            content_lines.append(f"### Record {i+1} (ID: {row_dict.get('id', 'unknown')})")
            
            # Add creation date
            created_at = row_dict.get('created_at', '')
            if created_at:
                content_lines.append(f"- Created: {created_at}")
            
            # Add brief content preview
            for field in config['content_fields']:
                if field in row_dict and row_dict[field]:
                    value = row_dict[field]
                    # Truncate long content for summary
                    if len(str(value)) > 200:
                        preview = str(value)[:200] + "..."
                    else:
                        preview = str(value)
                    content_lines.append(f"- {field}: {preview}")
            
            content_lines.append("")
        
        return Document(
            page_content="\n".join(content_lines),
            metadata={
                "table_name": table_name,
                "file_path": f"database/memory.db#{table_name}",
                "content_type": "application/x-sqlite3",
                "source": "ai_recommendations",
                "record_count": len(rows),
                "description": config['description'],
                "document_type": "summary",
                "data_category": self._get_data_category(table_name)
            }
        )
    
    def _create_record_documents(self, table_name: str, config: Dict, rows: List) -> List[Document]:
        """Create individual documents for each database record"""
        documents = []
        
        for i, row in enumerate(rows):
            row_dict = dict(row)
            
            content_lines = [f"## {table_name.replace('_', ' ').title()} Record {row_dict.get('id', i+1)}"]
            
            # Add metadata information
            content_lines.append("### Metadata:")
            for field in config['metadata_fields']:
                if field in row_dict and row_dict[field]:
                    content_lines.append(f"- {field.replace('_', ' ').title()}: {row_dict[field]}")
            
            content_lines.append("")
            
            # Add main content
            content_lines.append("### Content:")
            for field in config['content_fields']:
                if field in row_dict and row_dict[field]:
                    value = row_dict[field]
                    
                    # Handle JSON fields
                    if field.endswith('_json') and value:
                        try:
                            parsed_json = json.loads(value)
                            content_lines.append(f"#### {field.replace('_', ' ').title()}:")
                            
                            # Format JSON content for better readability
                            if isinstance(parsed_json, dict):
                                for key, val in parsed_json.items():
                                    if isinstance(val, (dict, list)):
                                        content_lines.append(f"- {key}: {json.dumps(val, indent=2)}")
                                    else:
                                        content_lines.append(f"- {key}: {val}")
                            else:
                                content_lines.append(f"```json\n{json.dumps(parsed_json, indent=2)}\n```")
                        except json.JSONDecodeError:
                            content_lines.append(f"#### {field.replace('_', ' ').title()}:")
                            content_lines.append(str(value))
                    else:
                        content_lines.append(f"#### {field.replace('_', ' ').title()}:")
                        content_lines.append(str(value))
                    
                    content_lines.append("")
            
            # Add analysis based on table type
            if table_name == "openai_recommendations":
                analysis = self._analyze_openai_recommendation(row_dict)
                if analysis:
                    content_lines.append("### Analysis:")
                    content_lines.extend(analysis)
            elif table_name == "market_research":
                analysis = self._analyze_market_research(row_dict)
                if analysis:
                    content_lines.append("### Analysis:")
                    content_lines.extend(analysis)
            
            doc = Document(
                page_content="\n".join(content_lines),
                metadata={
                    "table_name": table_name,
                    "file_path": f"database/memory.db#{table_name}",
                    "content_type": "application/x-sqlite3",
                    "source": "ai_recommendations",
                    "record_id": row_dict.get('id'),
                    "record_index": i,
                    "document_type": "record",
                    "data_category": self._get_data_category(table_name),
                    "created_at": row_dict.get('created_at'),
                    **{k: v for k, v in row_dict.items() if not isinstance(v, (dict, list))}
                }
            )
            documents.append(doc)
        
        return documents
    
    def _create_time_aggregated_documents(self, table_name: str, config: Dict, rows: List) -> List[Document]:
        """Create time-based aggregated documents"""
        documents = []
        
        # Group records by month
        monthly_groups = {}
        for row in rows:
            row_dict = dict(row)
            created_at = row_dict.get('created_at', '')
            
            if created_at:
                try:
                    # Extract year-month from timestamp
                    month_key = created_at[:7]  # YYYY-MM format
                    if month_key not in monthly_groups:
                        monthly_groups[month_key] = []
                    monthly_groups[month_key].append(row_dict)
                except Exception:
                    # If date parsing fails, put in 'unknown' group
                    if 'unknown' not in monthly_groups:
                        monthly_groups['unknown'] = []
                    monthly_groups['unknown'].append(row_dict)
        
        for month, month_rows in monthly_groups.items():
            content = f"# {table_name.replace('_', ' ').title()} - {month}\n"
            content += f"Period: {month}\n"
            content += f"Total records: {len(month_rows)}\n"
            content += f"Description: {config['description']}\n\n"
            
            # Add summary of activities
            content += "## Activities Summary:\n"
            for i, row in enumerate(month_rows[:10]):  # Limit to first 10 for readability
                content += f"### Activity {i+1} (ID: {row.get('id')})\n"
                content += f"- Created: {row.get('created_at')}\n"
                
                # Add brief content preview
                for field in config['content_fields']:
                    if field in row and row[field]:
                        value = str(row[field])
                        if len(value) > 100:
                            preview = value[:100] + "..."
                        else:
                            preview = value
                        content += f"- {field}: {preview}\n"
                
                content += "\n"
            
            if len(month_rows) > 10:
                content += f"... and {len(month_rows) - 10} more records\n"
            
            doc = Document(
                page_content=content,
                metadata={
                    "table_name": table_name,
                    "source": "ai_recommendations",
                    "document_type": "aggregation",
                    "aggregation_type": "monthly",
                    "month": month,
                    "record_count": len(month_rows),
                    "data_category": self._get_data_category(table_name)
                }
            )
            documents.append(doc)
        
        return documents
    
    def _analyze_openai_recommendation(self, row_dict: Dict) -> List[str]:
        """Analyze an OpenAI recommendation record"""
        analysis = []
        
        data_json = row_dict.get('data_json', '')
        if data_json:
            try:
                data = json.loads(data_json)
                
                if isinstance(data, dict):
                    # Look for key insights
                    if 'recommendations' in data:
                        recommendations = data['recommendations']
                        if isinstance(recommendations, list):
                            analysis.append(f"- Contains {len(recommendations)} recommendations")
                        else:
                            analysis.append("- Contains business recommendations")
                    
                    if 'insights' in data:
                        analysis.append("- Includes business insights and analysis")
                    
                    if 'forecast' in data or 'prediction' in data:
                        analysis.append("- Contains financial forecasts or predictions")
                        
            except json.JSONDecodeError:
                pass
        
        return analysis
    
    def _analyze_market_research(self, row_dict: Dict) -> List[str]:
        """Analyze a market research record"""
        analysis = []
        
        output_text = row_dict.get('output_text', '')
        if output_text:
            text_length = len(output_text)
            analysis.append(f"- Research report length: {text_length} characters")
            
            # Look for key themes
            text_lower = output_text.lower()
            themes = []
            
            if 'market' in text_lower:
                themes.append('market analysis')
            if 'competitor' in text_lower or 'competition' in text_lower:
                themes.append('competitive analysis')
            if 'trend' in text_lower:
                themes.append('trend analysis')
            if 'opportunity' in text_lower:
                themes.append('opportunity identification')
            
            if themes:
                analysis.append(f"- Research themes: {', '.join(themes)}")
        
        return analysis
    
    def _get_data_category(self, table_name: str) -> str:
        """Get data category for the table"""
        if "recommendation" in table_name:
            return "recommendations"
        elif "market_research" in table_name:
            return "market_research"
        else:
            return "ai_insights"
    
    def search_ai_recommendations(self, query: str, table_name: str = None, k: int = 5, score_threshold: float = 0.3) -> List[Dict[str, Any]]:
        """Search AI recommendations with optional table filtering"""
        results = self.search(query, k=k * 2, score_threshold=score_threshold)  # Get more results for filtering
        
        if table_name:
            # Filter by table name
            filtered_results = [
                result for result in results 
                if result.get("metadata", {}).get("table_name") == table_name
            ]
            return filtered_results[:k]
        
        return results[:k]
