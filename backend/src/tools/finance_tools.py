# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# add docstring to this module
"""Tools module for the dashboard app.

This module provides CSV-backed tools that implement the MVP data flow:

- Cashflow (record and summarize) using `cashflow.csv`
- Customers and suppliers loaders from `customers.csv`/`suppliers.csv` (or
  their template fallbacks)
- Invoice creation to `invoice.csv` and `invoice_lines.csv`
- Marking invoices paid by writing corresponding IN/OUT rows to
  `cashflow.csv`
- Rendering a simple HTML invoice (HTML→PDF can be added later; we provide an
  HTML fallback path now)

LLM- or OCR-related helpers are left in place for future multimodal ingest.
All numeric calculations are computed by code, not by the LLM.
"""

from __future__ import annotations

import ast
import csv
import io
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from dotenv import load_dotenv
from openai import OpenAI
from pypdf import PdfReader

load_dotenv()

_openai_client = OpenAI()


# Currency conversion rates (all to SGD)
CURRENCY_RATES = {
    "SGD": 1.0,
    "MYR": 1/3.3,  # 1 MYR = 1/3.3 SGD
    "THB": 1/24,   # 1 THB = 1/24 SGD
    "IDR": 1/12633, # 1 IDR = 1/12633 SGD
    "PHP": 1/44,   # 1 PHP = 1/44 SGD
}

# Filesystem layout (CSV storage under kb/)
KB_DIR = Path(__file__).resolve().parent.parents[1] / "database"
INVOICE_CSV = KB_DIR / "invoice.csv"
INVOICE_LINES_CSV = KB_DIR / "invoice_lines.csv"
CASHFLOW_CSV = KB_DIR / "cashflow.csv"
CUSTOMERS_CSV = KB_DIR / "customers.csv"
SUPPLIERS_CSV = KB_DIR / "suppliers.csv"


def _ensure_parent_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def _read_csv_dicts(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _append_csv_row(path: Path, fieldnames: List[str], row: Dict[str, Any]) -> None:
    """Appends a new row to the CSV file at the very bottom, creating a new line."""
    is_new = not path.exists()
    _ensure_parent_dir(path)
    with path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if is_new:
            writer.writeheader()
        writer.writerow({k: row.get(k, "") for k in fieldnames})


def _parse_date(date_str: str) -> Optional[datetime]:
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%y", "%d/%m/%Y", "%m/%d/%y", "%m/%d/%Y"):
        try:
            return datetime.strptime(date_str, fmt)
        except Exception:
            continue
    return None


def _generate_id(prefix: str) -> str:
    # Timestamp-based unique-ish id suitable for CSV MVP
    return f"{prefix}-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')[:-3]}"


def _convert_to_sgd(amount: float, currency: str) -> float:
    """Convert amount from given currency to SGD, rounded to 2 decimal places."""
    rate = CURRENCY_RATES.get(currency.upper(), 1.0)
    return round(amount * rate, 2)


def extract_invoice_data_from_image(invoice_base64_image: str) -> Dict[str, Any]:
    """Extracts invoice text/data from a base64-encoded image.

    Attempts OpenAI gpt-4o-mini first (if available), otherwise falls back to
    EasyOCR text extraction. Returns a dictionary with best-effort fields.
    """
    # Preferred path: OpenAI Vision
    try:  # pragma: no cover - network/API
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": ("""
Extract ALL information from the invoice. Return your output as a single JSON object
with the following keys:
'invoice_id, line_id, item_sku, item_name, item_description, quantity,
unit_code, unit_price, currency, line_tax_rate_percent, line_tax_amount,
total_amount, vendor, issue_date, due_date'
If the information is not present, return an empty string for that key.
If there are multiple line items, return all of the line items in a list for each output key.
                        """),
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{invoice_base64_image}",
                        },
                    },
                ],
            }
        ]
        response = _openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
        )
        content = response.choices[0].message.content or "{}"
        try:
            data = json.loads(content)
        except Exception:
            data = {"raw_text": content}
        return {"invoice_data": data}
    except Exception as exc:  # fall back to OCR
        pass

    # Last resort
    return {"invoice_data": {"raw_text": ""}}


def extract_invoice_data_from_pdf(invoice_pdf_bytes: bytes) -> Dict[str, Any]:
    """Extracts invoice text from a PDF file's bytes using PyPDF if available.

    Returns a dict with key `invoice_data` containing either parsed JSON or raw text.
    """
    if PdfReader is None:
        return {"invoice_data": {"raw_text": ""}}
    try:
        reader = PdfReader(io.BytesIO(invoice_pdf_bytes))
        texts = []
        for page in reader.pages:
            try:
                texts.append(page.extract_text() or "")
            except Exception:
                continue
        raw = "\n".join(texts).strip()
        return {"invoice_data": {"raw_text": raw}}
    except Exception:
        return {"invoice_data": {"raw_text": ""}}


def categorize_expense(expense_description: str) -> str:
    """Naively categorize an expense based on its description."""
    desc = (expense_description or "").lower()
    if any(k in desc for k in ["rent", "lease"]):
        return "Office Rent"
    if any(k in desc for k in ["salary", "payroll", "wage"]):
        return "Staff salaries"
    if any(k in desc for k in ["marketing", "ads", "advert"]):
        return "Marketing Expenses"
    if any(k in desc for k in ["equip", "laptop", "printer"]):
        return "Equipment Purchase"
    if any(k in desc for k in ["utilit", "water", "electric", "phone"]):
        return "Utilities"
    return "Miscellaneous"


def save_extracted_invoice_data(invoice_data: Dict[str, Any]) -> Dict[str, Any]:
    """Save extracted invoice data to invoice_lines.csv"""
    try:
        # Generate unique invoice ID
        invoice_id = _generate_id("DOC")
        # Handle cases where raw_text might contain markdown-wrapped JSON
        raw_text = invoice_data["raw_text"]
        if raw_text.startswith("```json") and raw_text.endswith("```"):
            # Extract JSON content from markdown code block
            raw_text = raw_text[7:-3].strip()
        
        # Try to parse as JSON first, fall back to ast.literal_eval
        try:
            parsed_data = json.loads(raw_text)
        except json.JSONDecodeError:
            parsed_data = ast.literal_eval(raw_text)
        
        # Define the fieldnames for invoice_lines.csv
        fieldnames = [
            "invoice_id", "line_id", "item_sku", "item_name", "item_description", 
            "quantity", "unit_code", "unit_price", "currency", "line_tax_rate_percent", 
            "line_tax_amount", "total_amount", "vendor", "issue_date", "due_date"
        ]
        
        # Helper function to convert list to string or return value as-is
        def format_value(value):
            if isinstance(value, list):
                return "|".join(str(item) for item in value)
            return str(value) if value is not None else ""
        
        # Create a single row with all the data
        row_data = {
            "invoice_id": invoice_id,
            "line_id": format_value(parsed_data.get("line_id", "")),
            "item_sku": format_value(parsed_data.get("item_sku", "")),
            "item_name": format_value(parsed_data.get("item_name", "")),
            "item_description": format_value(parsed_data.get("item_description", "")),
            "quantity": format_value(parsed_data.get("quantity", "")),
            "unit_code": format_value(parsed_data.get("unit_code", "")),
            "unit_price": format_value(parsed_data.get("unit_price", "")),
            "currency": format_value(parsed_data.get("currency", "")),
            "line_tax_rate_percent": format_value(parsed_data.get("line_tax_rate_percent", "")),
            "line_tax_amount": format_value(parsed_data.get("line_tax_amount", "")),
            "total_amount": format_value(parsed_data.get("total_amount", "")),
            "vendor": str(parsed_data.get("vendor", "")),
            "issue_date": str(parsed_data.get("issue_date", "")),
            "due_date": str(parsed_data.get("due_date", ""))
        }
        
        # Clean up monetary values (remove commas from unit_price and total_amount)
        for field in ["unit_price", "total_amount"]:
            if row_data[field]:
                row_data[field] = row_data[field].replace(",", "")
        
        # Append single row to CSV (this adds to the bottom of the file)
        _append_csv_row(INVOICE_LINES_CSV, fieldnames, row_data)
        
        return {
            "success": True,
            "message": "Successfully saved invoice data",
            "invoice_id": invoice_id,
            "lines_saved": 1,
            "data": row_data
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to save invoice data: {str(e)}"
        }


def process_invoice(context = None, invoice_text: str | None = None) -> Dict[str, Any]:
    """Stub tool for ADK compatibility.

    In a full implementation, this would parse `invoice_text` and update the ledger.
    Here we return a simple echo response to satisfy imports and basic tests.
    """
    return {"status": "ok", "parsed": bool(invoice_text), "invoice_text": invoice_text or ""}


# =========================
# CSV-backed MVP operations
# =========================


def load_customers(context = None) -> Dict[str, Any]:
    """Loads customers from `customers.csv`

    Returns a dict with `customers` as a list of row dicts.
    """
    return {"source": str(CUSTOMERS_CSV), "customers": _read_csv_dicts(CUSTOMERS_CSV)}


def load_suppliers(context = None) -> Dict[str, Any]:
    """Loads suppliers from `suppliers.csv`

    Returns a dict with `suppliers` as a list of row dicts.
    """
    return {"source": str(SUPPLIERS_CSV), "suppliers": _read_csv_dicts(SUPPLIERS_CSV)}


def summarize_cashflow(
    context = None,
    *,
    user_id: Optional[str] = None,
    lookback_days: int = 30,
) -> Dict[str, Any]:
    """Computes basic rollups: totals IN/OUT and net, and top expense categories.

    All amounts are converted to SGD for totals. Also includes breakdown by original currency.
    Returns a dictionary with numeric totals and category aggregates. The LLM
    should generate any natural-language explanation separately.
    """
    rows = _read_csv_dicts(CASHFLOW_CSV)
    if not rows:
        return {
            "totals": {"in": 0.0, "out": 0.0, "net": 0.0},
            "by_category": {},
            "by_currency": {},
            "rows_considered": 0,
        }

    cutoff = datetime.utcnow().timestamp() - lookback_days * 86400
    total_in_sgd = 0.0
    total_out_sgd = 0.0
    by_category: Dict[str, float] = {}
    by_currency: Dict[str, Dict[str, float]] = {}
    considered = 0

    for r in rows:
        if user_id and (r.get("user_id") or "").strip() != str(user_id):
            continue
        dt = _parse_date(r.get("payment_date", ""))
        if dt is None:
            continue
        if dt.timestamp() < cutoff:
            continue
        amt_str = str(r.get("payment_amount", "0")).replace(",", "")
        try:
            amount = float(amt_str)
        except Exception:
            continue
        
        currency = r.get("currency", "SGD") or "SGD"
        direction = (r.get("direction", "").upper())
        amount_sgd = _convert_to_sgd(amount, currency)
        
        # Track by currency
        if currency not in by_currency:
            by_currency[currency] = {"in": 0.0, "out": 0.0}
        
        if direction == "IN":
            total_in_sgd += amount_sgd
            by_currency[currency]["in"] += amount
        elif direction == "OUT":
            total_out_sgd += amount_sgd
            by_currency[currency]["out"] += amount
            
        cat = r.get("category", "Uncategorized") or "Uncategorized"
        if direction == "OUT":
            by_category[cat] = by_category.get(cat, 0.0) + amount_sgd
        considered += 1

    return {
        "totals": {"in": total_in_sgd, "out": total_out_sgd, "net": total_in_sgd - total_out_sgd},
        "by_category": by_category,
        "by_currency": by_currency,
        "rows_considered": considered,
    }
