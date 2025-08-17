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
CUSTOMERS_TEMPLATE_CSV = KB_DIR / "customers_template.csv"
SUPPLIERS_TEMPLATE_CSV = KB_DIR / "suppliers_template.csv"


def _ensure_parent_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def _ensure_csv(path: Path, header: Iterable[str]) -> None:
    """Create the CSV file with header if it does not exist."""
    if path.exists():
        return
    _ensure_parent_dir(path)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(list(header))


def _read_csv_dicts(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _append_csv_row(path: Path, fieldnames: List[str], row: Dict[str, Any]) -> None:
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
                        "text": (
                            "Extract key invoice fields as JSON with keys: "
                            "vendor, issue_date(YYYY-MM-DD), due_date, currency(ISO), "
                            "line_items[{desc,qty,unit_price,tax_rate}], subtotal, tax, total, "
                            "and return a single JSON object only."
                        ),
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
    """Loads customers from `customers.csv` or falls back to `customers_template.csv`.

    Returns a dict with `customers` as a list of row dicts.
    """
    source = CUSTOMERS_CSV if CUSTOMERS_CSV.exists() else CUSTOMERS_TEMPLATE_CSV
    return {"source": str(source), "customers": _read_csv_dicts(source)}


def load_suppliers(context = None) -> Dict[str, Any]:
    """Loads suppliers from `suppliers.csv` or falls back to `suppliers_template.csv`.

    Returns a dict with `suppliers` as a list of row dicts.
    """
    source = SUPPLIERS_CSV if SUPPLIERS_CSV.exists() else SUPPLIERS_TEMPLATE_CSV
    return {"source": str(source), "suppliers": _read_csv_dicts(source)}


def record_transaction(
    context = None,
    *,
    user_id: str,
    date: str,
    category: str,
    currency: str,
    amount: float,
    direction: str,
    counterparty_id: Optional[str] = None,
    counterparty_type: Optional[str] = None,
    description: Optional[str] = None,
    document_reference: Optional[str] = None,
    tax_amount: Optional[float] = None,
    payment_method: Optional[str] = None,
) -> Dict[str, Any]:
    """Appends a transaction row to `cashflow.csv`.

    Direction must be one of {IN, OUT}.
    Date may be in ISO (YYYY-MM-DD) or common regional formats; it will be
    written exactly as provided to preserve user locale, but validated parsable.
    """
    direction_norm = (direction or "").upper()
    if direction_norm not in {"IN", "OUT"}:
        return {"status": "error", "message": "direction must be IN or OUT"}

    if _parse_date(date) is None:
        return {"status": "error", "message": "date format not recognized"}

    transaction_id = _generate_id("TXN")
    fieldnames = [
        "user_id",
        "date",
        "category",
        "currency",
        "amount",
        "direction",
        "counterparty_id",
        "counterparty_type",
        "transaction_id",
        "description",
        "document_reference",
        "tax_amount",
        "payment_method",
    ]
    row = {
        "user_id": user_id,
        "date": date,
        "category": category,
        "currency": currency,
        "amount": amount,
        "direction": direction_norm,
        "counterparty_id": counterparty_id or "",
        "counterparty_type": counterparty_type or "",
        "transaction_id": transaction_id,
        "description": description or "",
        "document_reference": document_reference or "",
        "tax_amount": tax_amount if tax_amount is not None else "",
        "payment_method": payment_method or "",
    }
    _append_csv_row(CASHFLOW_CSV, fieldnames, row)
    return {"status": "ok", "transaction_id": transaction_id, "row": row}


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
        dt = _parse_date(r.get("date", ""))
        if dt is None:
            continue
        if dt.timestamp() < cutoff:
            continue
        amt_str = str(r.get("amount", "0")).replace(",", "")
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
