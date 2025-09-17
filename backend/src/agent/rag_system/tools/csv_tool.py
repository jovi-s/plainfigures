"""
CSV Data Source Tool for financial data (cashflow, invoices)
"""

import csv
import logging
from typing import List, Dict, Any
from pathlib import Path
from datetime import datetime

from langchain_core.documents import Document
from .base_tool import BaseRAGTool

logger = logging.getLogger(__name__)


class CSVTool(BaseRAGTool):
    """Tool for accessing CSV financial data with FAISS vector search"""
    
    def __init__(self, data_dir: Path = None):
        super().__init__("csv_financial_data", data_dir)
        
        # Define CSV files to process
        self.csv_files = [
            "cashflow.csv",
            "invoice.csv", 
            "invoice_lines.csv"
        ]
    
    def load_documents(self) -> List[Document]:
        """Load CSV files as documents with structured data representation"""
        documents = []
        
        for csv_file in self.csv_files:
            csv_path = self.data_dir / csv_file
            if not csv_path.exists():
                logger.warning(f"CSV file not found: {csv_file}")
                continue
            
            try:
                with open(csv_path, 'r', encoding='utf-8') as file:
                    csv_reader = csv.DictReader(file)
                    rows = list(csv_reader)
                
                if not rows:
                    logger.warning(f"CSV file is empty: {csv_file}")
                    continue
                
                # Create documents for different granularities
                
                # 1. Overall summary document
                summary_doc = self._create_summary_document(csv_file, rows)
                documents.append(summary_doc)
                
                # 2. Individual record documents for detailed queries
                record_docs = self._create_record_documents(csv_file, rows)
                documents.extend(record_docs)
                
                # 3. Aggregated view documents (by category, date range, etc.)
                agg_docs = self._create_aggregated_documents(csv_file, rows)
                documents.extend(agg_docs)
                
                logger.info(f"Loaded {len(record_docs) + len(agg_docs) + 1} documents from {csv_file}")
                
            except Exception as e:
                logger.error(f"Error loading CSV {csv_file}: {e}")
        
        return documents
    
    def _create_summary_document(self, csv_file: str, rows: List[Dict]) -> Document:
        """Create a summary document for the entire CSV file"""
        content_lines = [f"# {csv_file.replace('.csv', '').replace('_', ' ').title()} Data Summary"]
        content_lines.append(f"Total records: {len(rows)}")
        content_lines.append(f"Data source: {csv_file}")
        content_lines.append("")
        
        if rows:
            columns = list(rows[0].keys())
            content_lines.append("## Available Columns:")
            content_lines.extend([f"- {col}" for col in columns])
            content_lines.append("")
        
        # Add specific insights based on file type
        if csv_file == "cashflow.csv":
            content_lines.extend(self._analyze_cashflow_data(rows))
        elif csv_file == "invoice.csv":
            content_lines.extend(self._analyze_invoice_data(rows))
        elif csv_file == "invoice_lines.csv":
            content_lines.extend(self._analyze_invoice_lines_data(rows))
        
        return Document(
            page_content="\n".join(content_lines),
            metadata={
                "filename": csv_file,
                "file_path": str(self.data_dir / csv_file),
                "content_type": "text/csv",
                "source": "financial_data",
                "record_count": len(rows),
                "document_type": "summary",
                "data_category": self._get_data_category(csv_file)
            }
        )
    
    def _create_record_documents(self, csv_file: str, rows: List[Dict]) -> List[Document]:
        """Create individual documents for each record"""
        documents = []
        
        for i, row in enumerate(rows):
            # Create a readable text representation of the record
            content_lines = [f"## {csv_file.replace('.csv', '').title()} Record {i+1}"]
            
            # Add key-value pairs
            for key, value in row.items():
                if value:  # Only include non-empty values
                    content_lines.append(f"- {key.replace('_', ' ').title()}: {value}")
            
            # Add contextual information based on file type
            if csv_file == "cashflow.csv":
                content_lines.append("")
                content_lines.append("## Transaction Analysis:")
                content_lines.extend(self._analyze_single_cashflow_record(row))
            elif csv_file == "invoice.csv":
                content_lines.append("")
                content_lines.append("## Invoice Analysis:")
                content_lines.extend(self._analyze_single_invoice_record(row))
            
            doc = Document(
                page_content="\n".join(content_lines),
                metadata={
                    "filename": csv_file,
                    "file_path": str(self.data_dir / csv_file),
                    "content_type": "text/csv",
                    "source": "financial_data",
                    "record_index": i,
                    "document_type": "record",
                    "data_category": self._get_data_category(csv_file),
                    **row  # Include all row data in metadata for filtering
                }
            )
            documents.append(doc)
        
        return documents
    
    def _create_aggregated_documents(self, csv_file: str, rows: List[Dict]) -> List[Document]:
        """Create aggregated view documents for analysis"""
        documents = []
        
        if csv_file == "cashflow.csv":
            documents.extend(self._create_cashflow_aggregations(rows))
        elif csv_file == "invoice.csv":
            documents.extend(self._create_invoice_aggregations(rows))
        
        return documents
    
    def _analyze_cashflow_data(self, rows: List[Dict]) -> List[str]:
        """Analyze cashflow data for insights"""
        insights = ["## Cashflow Data Insights:"]
        
        # Currency analysis
        currencies = set(row.get('currency', '') for row in rows if row.get('currency'))
        if currencies:
            insights.append(f"- Currencies: {', '.join(currencies)}")
        
        # Direction analysis
        directions = set(row.get('direction', '') for row in rows if row.get('direction'))
        if directions:
            insights.append(f"- Transaction directions: {', '.join(directions)}")
        
        # Category analysis
        categories = set(row.get('category', '') for row in rows if row.get('category'))
        if categories:
            insights.append(f"- Transaction categories: {', '.join(list(categories)[:10])}...")
        
        # Amount analysis (basic)
        amounts = []
        for row in rows:
            try:
                amount = float(row.get('payment_amount', 0) or 0)
                if amount > 0:
                    amounts.append(amount)
            except (ValueError, TypeError):
                continue
        
        if amounts:
            insights.append(f"- Total transactions: {len(amounts)}")
            insights.append(f"- Amount range: {min(amounts):.2f} to {max(amounts):.2f}")
        
        return insights
    
    def _analyze_invoice_data(self, rows: List[Dict]) -> List[str]:
        """Analyze invoice data for insights"""
        insights = ["## Invoice Data Insights:"]
        
        # Status analysis
        statuses = set(row.get('status', '') for row in rows if row.get('status'))
        if statuses:
            insights.append(f"- Invoice statuses: {', '.join(statuses)}")
        
        # Currency analysis
        currencies = set(row.get('currency_code', '') for row in rows if row.get('currency_code'))
        if currencies:
            insights.append(f"- Currencies: {', '.join(currencies)}")
        
        # Type analysis
        types = set(row.get('invoice_type', '') for row in rows if row.get('invoice_type'))
        if types:
            insights.append(f"- Invoice types: {', '.join(types)}")
        
        return insights
    
    def _analyze_invoice_lines_data(self, rows: List[Dict]) -> List[str]:
        """Analyze invoice lines data"""
        insights = ["## Invoice Lines Data Insights:"]
        insights.append(f"- Total line items: {len(rows)}")
        
        # Unique invoices
        invoice_ids = set(row.get('invoice_id', '') for row in rows if row.get('invoice_id'))
        insights.append(f"- Covers {len(invoice_ids)} invoices")
        
        return insights
    
    def _analyze_single_cashflow_record(self, row: Dict) -> List[str]:
        """Analyze a single cashflow record"""
        analysis = []
        
        direction = row.get('direction', '').upper()
        amount = row.get('payment_amount', '')
        currency = row.get('currency', '')
        category = row.get('category', '')
        
        if direction == 'IN':
            analysis.append(f"- This is an income transaction of {amount} {currency}")
        elif direction == 'OUT':
            analysis.append(f"- This is an expense transaction of {amount} {currency}")
        
        if category:
            analysis.append(f"- Categorized as: {category}")
        
        payment_date = row.get('payment_date', '')
        if payment_date:
            analysis.append(f"- Transaction date: {payment_date}")
        
        return analysis
    
    def _analyze_single_invoice_record(self, row: Dict) -> List[str]:
        """Analyze a single invoice record"""
        analysis = []
        
        status = row.get('status', '')
        amount = row.get('payable_amount_total', '')
        currency = row.get('currency_code', '')
        invoice_type = row.get('invoice_type', '')
        
        if status:
            analysis.append(f"- Invoice status: {status}")
        
        if invoice_type:
            analysis.append(f"- Type: {invoice_type}")
        
        if amount and currency:
            analysis.append(f"- Total amount: {amount} {currency}")
        
        due_date = row.get('due_date', '')
        if due_date:
            analysis.append(f"- Due date: {due_date}")
        
        return analysis
    
    def _create_cashflow_aggregations(self, rows: List[Dict]) -> List[Document]:
        """Create aggregated cashflow documents"""
        documents = []
        
        # Group by category
        category_groups = {}
        for row in rows:
            category = row.get('category', 'Unknown')
            if category not in category_groups:
                category_groups[category] = []
            category_groups[category].append(row)
        
        for category, category_rows in category_groups.items():
            content = f"# Cashflow Summary for Category: {category}\n"
            content += f"Total transactions: {len(category_rows)}\n\n"
            
            # Calculate totals by direction
            in_total = sum(float(row.get('payment_amount', 0) or 0) 
                          for row in category_rows 
                          if row.get('direction') == 'IN')
            out_total = sum(float(row.get('payment_amount', 0) or 0) 
                           for row in category_rows 
                           if row.get('direction') == 'OUT')
            
            content += f"Income: {in_total:.2f}\n"
            content += f"Expenses: {out_total:.2f}\n"
            content += f"Net: {in_total - out_total:.2f}\n"
            
            doc = Document(
                page_content=content,
                metadata={
                    "filename": "cashflow.csv",
                    "source": "financial_data",
                    "document_type": "aggregation",
                    "aggregation_type": "category",
                    "category": category,
                    "transaction_count": len(category_rows),
                    "data_category": "cashflow"
                }
            )
            documents.append(doc)
        
        return documents
    
    def _create_invoice_aggregations(self, rows: List[Dict]) -> List[Document]:
        """Create aggregated invoice documents"""
        documents = []
        
        # Group by status
        status_groups = {}
        for row in rows:
            status = row.get('status', 'Unknown')
            if status not in status_groups:
                status_groups[status] = []
            status_groups[status].append(row)
        
        for status, status_rows in status_groups.items():
            content = f"# Invoice Summary for Status: {status}\n"
            content += f"Total invoices: {len(status_rows)}\n\n"
            
            # Calculate totals
            total_amount = sum(float(row.get('payable_amount_total', 0) or 0) 
                             for row in status_rows)
            
            content += f"Total value: {total_amount:.2f}\n"
            
            # Currency breakdown
            currencies = {}
            for row in status_rows:
                curr = row.get('currency_code', 'Unknown')
                amount = float(row.get('payable_amount_total', 0) or 0)
                currencies[curr] = currencies.get(curr, 0) + amount
            
            content += "\nCurrency breakdown:\n"
            for curr, amount in currencies.items():
                content += f"- {curr}: {amount:.2f}\n"
            
            doc = Document(
                page_content=content,
                metadata={
                    "filename": "invoice.csv",
                    "source": "financial_data",
                    "document_type": "aggregation",
                    "aggregation_type": "status",
                    "status": status,
                    "invoice_count": len(status_rows),
                    "data_category": "invoices"
                }
            )
            documents.append(doc)
        
        return documents
    
    def _get_data_category(self, csv_file: str) -> str:
        """Get data category for the CSV file"""
        if "cashflow" in csv_file:
            return "cashflow"
        elif "invoice" in csv_file:
            return "invoices"
        else:
            return "financial_data"
    
    def search_financial_data(self, query: str, data_category: str = None, k: int = 5, score_threshold: float = 0.3) -> List[Dict[str, Any]]:
        """Search financial data with optional category filtering"""
        results = self.search(query, k=k * 2, score_threshold=score_threshold)  # Get more results for filtering
        
        if data_category:
            # Filter by data category
            filtered_results = [
                result for result in results 
                if result.get("metadata", {}).get("data_category") == data_category
            ]
            return filtered_results[:k]
        
        return results[:k]
