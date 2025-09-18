"""
CSV Data Source Tool for financial data (cashflow, invoices) - Direct Access
"""

import csv
import logging
import json
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime

# Import the finance_tools module for direct CSV operations
import sys
finance_tools_path = Path(__file__).parent.parent.parent.parent / "tools"
sys.path.insert(0, str(finance_tools_path))
from finance_tools import summarize_cashflow, load_customers, load_suppliers, _read_csv_dicts

logger = logging.getLogger(__name__)


class CSVTool:
    """Tool for accessing CSV financial data directly (no vector database)"""
    
    def __init__(self, data_dir: Optional[Path] = None):
        self.tool_name = "csv_financial_data"
        self.data_dir = data_dir or Path(__file__).parent.parent.parent.parent.parent / "database"
        
        # Define CSV files and their purposes
        self.csv_files = {
            "cashflow.csv": "Cash flow transactions (income and expenses)",
            "invoice.csv": "Invoice records",
            "invoice_lines.csv": "Detailed invoice line items",
            "customers.csv": "Customer information",
            "suppliers.csv": "Supplier information"
        }
        
        self.is_initialized = True  # No initialization needed for direct access
        logger.info(f"Initialized CSV tool for direct data access")
    
    def initialize(self, force_rebuild: bool = False) -> bool:
        """Initialize CSV tool - always returns True as no setup needed"""
        return True
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about available CSV files"""
        stats = {"files": {}}
        
        for csv_file, description in self.csv_files.items():
            csv_path = self.data_dir / csv_file
            if csv_path.exists():
                try:
                    rows = _read_csv_dicts(csv_path)
                    stats["files"][csv_file] = {
                        "exists": True,
                        "description": description,
                        "row_count": len(rows),
                        "columns": list(rows[0].keys()) if rows else []
                    }
                except Exception as e:
                    stats["files"][csv_file] = {
                        "exists": True,
                        "description": description,
                        "error": str(e)
                    }
            else:
                stats["files"][csv_file] = {
                    "exists": False,
                    "description": description
                }
        
        return stats
    
    def search_financial_data(self, query: str, data_category: str = None, k: int = 5, score_threshold: float = 0.3) -> List[Dict[str, Any]]:
        """Search financial data and return direct results from CSV functions"""
        try:
            logger.info(f"🔍 CSV DIRECT: Processing query '{query}' with category '{data_category}'")
            
            # Parse query to determine what data to return
            query_lower = query.lower()
            results = []
            
            # Cashflow queries
            if any(term in query_lower for term in ['cashflow', 'cash flow', 'income', 'expense', 'revenue', 'profit', 'financial summary', 'totals', 'forecasting']):
                cashflow_result = self._get_cashflow_summary(query)
                if cashflow_result:
                    results.append(cashflow_result)
            
            # Invoice queries
            if any(term in query_lower for term in ['invoice', 'bill', 'payable', 'receivable']):
                invoice_result = self._get_invoice_summary(query)
                if invoice_result:
                    results.append(invoice_result)
            
            # Customer/Supplier queries
            if any(term in query_lower for term in ['customer', 'client', 'supplier', 'vendor']):
                contacts_result = self._get_contacts_summary(query)
                if contacts_result:
                    results.append(contacts_result)
            
            # If no specific category detected, provide general overview
            if not results:
                results.append(self._get_general_overview(query))
            
            logger.info(f"📊 CSV DIRECT: Returning {len(results)} results for query")
            return results
            
        except Exception as e:
            logger.error(f"❌ CSV DIRECT ERROR: Failed to process query '{query}' - {str(e)}")
            return [{
                "content": f"Error processing CSV data: {str(e)}",
                "score": 0.1,
                "metadata": {"source": "csv_error", "error": True}
            }]
    
    def _get_cashflow_summary(self, query: str) -> Dict[str, Any]:
        """Get cashflow summary using finance_tools"""
        try:
            # Use different lookback periods based on query context
            lookback_days = 30  # default
            if 'year' in query.lower() or 'annual' in query.lower():
                lookback_days = 365
            elif 'quarter' in query.lower() or '3 month' in query.lower():
                lookback_days = 90
            elif 'month' in query.lower():
                lookback_days = 30
            elif 'week' in query.lower():
                lookback_days = 7
            elif 'all' in query.lower() or 'complete' in query.lower() or 'total' in query.lower():
                lookback_days = 3650  # ~10 years
            
            summary = summarize_cashflow(lookback_days=lookback_days)
            
            # Format the response
            content = f"# Cash Flow Summary ({lookback_days} days lookback)\n\n"
            
            totals = summary.get('totals', {})
            content += f"**Financial Overview:**\n"
            content += f"- Total Income: {totals.get('in', 0):,.2f} SGD\n"
            content += f"- Total Expenses: {totals.get('out', 0):,.2f} SGD\n"
            content += f"- Net Cash Flow: {totals.get('net', 0):,.2f} SGD\n"
            content += f"- Transactions Analyzed: {summary.get('rows_considered', 0)}\n\n"
            
            # Currency breakdown
            by_currency = summary.get('by_currency', {})
            if by_currency:
                content += "**Cash Flow by Currency:**\n"
                for currency, amounts in sorted(by_currency.items()):
                    income = amounts.get('in', 0)
                    expenses = amounts.get('out', 0)
                    net = income - expenses
                    content += f"- {currency}: Income {income:,.2f}, Expenses {expenses:,.2f}, Net {net:,.2f}\n"
                content += "\n"
            
            # Top expense categories
            by_category = summary.get('by_category', {})
            if by_category:
                content += "**Top Expense Categories (SGD):**\n"
                sorted_categories = sorted(by_category.items(), key=lambda x: x[1], reverse=True)[:10]
                for category, amount in sorted_categories:
                    content += f"- {category}: {amount:,.2f} SGD\n"
            
            return {
                "content": content,
                "score": 0.95,
                "metadata": {
                    "source": "cashflow_summary",
                    "lookback_days": lookback_days,
                    "transactions_count": summary.get('rows_considered', 0),
                    "data_type": "financial"
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting cashflow summary: {e}")
            return None
    
    def _get_invoice_summary(self, query: str) -> Dict[str, Any]:
        """Get invoice summary from invoice CSV files"""
        try:
            invoice_path = self.data_dir / "invoice.csv"
            invoice_lines_path = self.data_dir / "invoice_lines.csv"
            
            content = "# Invoice Summary\n\n"
            
            # Get invoice data
            if invoice_path.exists():
                invoices = _read_csv_dicts(invoice_path)
                content += f"**Invoice Overview:**\n"
                content += f"- Total Invoices: {len(invoices)}\n"
                
                # Status breakdown
                status_counts = {}
                currency_totals = {}
                
                for invoice in invoices:
                    status = invoice.get('status', 'Unknown')
                    status_counts[status] = status_counts.get(status, 0) + 1
                    
                    currency = invoice.get('currency_code', 'SGD')
                    try:
                        amount = float(invoice.get('payable_amount_total', 0) or 0)
                        if amount > 0:
                            if currency not in currency_totals:
                                currency_totals[currency] = {'total': 0, 'count': 0}
                            currency_totals[currency]['total'] += amount
                            currency_totals[currency]['count'] += 1
                    except (ValueError, TypeError):
                        continue
                
                if status_counts:
                    content += "\n**Invoice Status Breakdown:**\n"
                    for status, count in sorted(status_counts.items()):
                        content += f"- {status}: {count} invoices\n"
                
                if currency_totals:
                    content += "\n**Invoice Totals by Currency:**\n"
                    for currency, data in sorted(currency_totals.items()):
                        content += f"- {currency}: {data['total']:,.2f} ({data['count']} invoices)\n"
            
            # Get invoice lines data
            if invoice_lines_path.exists():
                lines = _read_csv_dicts(invoice_lines_path)
                content += f"\n**Invoice Lines Summary:**\n"
                content += f"- Total Line Items: {len(lines)}\n"
                
                # Unique invoices covered
                unique_invoices = set(line.get('invoice_id', '') for line in lines if line.get('invoice_id'))
                content += f"- Covers {len(unique_invoices)} invoices\n"
            
            return {
                "content": content,
                "score": 0.90,
                "metadata": {
                    "source": "invoice_summary",
                    "data_type": "invoices"
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting invoice summary: {e}")
            return None
    
    def _get_contacts_summary(self, query: str) -> Dict[str, Any]:
        """Get customers and suppliers summary"""
        try:
            content = "# Contacts Summary\n\n"
            
            # Get customers
            customers_data = load_customers()
            customers = customers_data.get('customers', [])
            content += f"**Customers:**\n"
            content += f"- Total Customers: {len(customers)}\n"
            
            if customers:
                # Show sample customer data structure
                sample_customer = customers[0]
                content += f"- Sample customer fields: {', '.join(sample_customer.keys())}\n"
            
            # Get suppliers
            suppliers_data = load_suppliers()
            suppliers = suppliers_data.get('suppliers', [])
            content += f"\n**Suppliers:**\n"
            content += f"- Total Suppliers: {len(suppliers)}\n"
            
            if suppliers:
                # Show sample supplier data structure
                sample_supplier = suppliers[0]
                content += f"- Sample supplier fields: {', '.join(sample_supplier.keys())}\n"
            
            return {
                "content": content,
                "score": 0.85,
                "metadata": {
                    "source": "contacts_summary",
                    "customers_count": len(customers),
                    "suppliers_count": len(suppliers),
                    "data_type": "contacts"
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting contacts summary: {e}")
            return None
    
    def _get_general_overview(self, query: str) -> Dict[str, Any]:
        """Get general overview of all available CSV data"""
        try:
            content = "# Financial Data Overview\n\n"
            content += "Available datasets and their current status:\n\n"
            
            for csv_file, description in self.csv_files.items():
                csv_path = self.data_dir / csv_file
                if csv_path.exists():
                    try:
                        rows = _read_csv_dicts(csv_path)
                        content += f"**{csv_file}** - {description}\n"
                        content += f"- Records: {len(rows)}\n"
                        if rows:
                            content += f"- Columns: {', '.join(list(rows[0].keys())[:5])}{'...' if len(rows[0].keys()) > 5 else ''}\n"
                        content += "\n"
                    except Exception as e:
                        content += f"**{csv_file}** - {description}\n"
                        content += f"- Error reading file: {str(e)}\n\n"
                else:
                    content += f"**{csv_file}** - {description}\n"
                    content += f"- Status: File not found\n\n"
            
            content += "\n**Query Suggestions:**\n"
            content += "- For cash flow analysis: 'summarize cashflow', 'show revenue and expenses'\n"
            content += "- For invoice data: 'show invoice summary', 'invoice status breakdown'\n"
            content += "- For contacts: 'list customers', 'show suppliers'\n"
            
            return {
                "content": content,
                "score": 0.75,
                "metadata": {
                    "source": "general_overview",
                    "data_type": "overview"
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting general overview: {e}")
            return {
                "content": f"Error generating overview: {str(e)}",
                "score": 0.1,
                "metadata": {"source": "overview_error", "error": True}
            }
    
    def search(self, query: str, k: int = 5, score_threshold: float = 0.3) -> List[Dict[str, Any]]:
        """Legacy search method for compatibility"""
        return self.search_financial_data(query, k=k, score_threshold=score_threshold)
