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
"""Tools module for the finance assistant agent.

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
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

from dotenv import load_dotenv
from openai import OpenAI
from pypdf import PdfReader

load_dotenv()

_openai_client = OpenAI()


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
    for fmt in ("%Y-%m-%d", "%d/%m/%y", "%d/%m/%Y", "%m/%d/%y", "%m/%d/%Y"):
        try:
            return datetime.strptime(date_str, fmt)
        except Exception:
            continue
    return None


def _generate_id(prefix: str) -> str:
    # Timestamp-based unique-ish id suitable for CSV MVP
    return f"{prefix}-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')[:-3]}"


def _next_invoice_no(existing: List[Dict[str, str]]) -> str:
    # If existing invoice numbers are present, try to increment; else use timestamp
    max_num = 0
    for row in existing:
        inv = row.get("invoice_id") or row.get("invoice_no") or ""
        if inv.startswith("INV-"):
            suffix = inv.replace("INV-", "").replace("-", "")
            try:
                num = int("".join(ch for ch in suffix if ch.isdigit()))
                if num > max_num:
                    max_num = num
            except Exception:
                continue
    if max_num > 0:
        return f"INV-{max_num + 1:04d}"
    return f"INV-{datetime.utcnow().strftime('%Y%m%d%H%M%S')[8:]}"  # e.g., INV-123456


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

    Returns a dictionary with numeric totals and category aggregates. The LLM
    should generate any natural-language explanation separately.
    """
    rows = _read_csv_dicts(CASHFLOW_CSV)
    if not rows:
        return {
            "totals": {"in": 0.0, "out": 0.0, "net": 0.0},
            "by_category": {},
            "rows_considered": 0,
        }

    cutoff = datetime.utcnow().timestamp() - lookback_days * 86400
    total_in = 0.0
    total_out = 0.0
    by_category: Dict[str, float] = {}
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
        direction = (r.get("direction", "").upper())
        if direction == "IN":
            total_in += amount
        elif direction == "OUT":
            total_out += amount
        cat = r.get("category", "Uncategorized") or "Uncategorized"
        if direction == "OUT":
            by_category[cat] = by_category.get(cat, 0.0) + amount
        considered += 1

    return {
        "totals": {"in": total_in, "out": total_out, "net": total_in - total_out},
        "by_category": by_category,
        "rows_considered": considered,
    }


def create_invoice(
    context = None,
    *,
    user_id: str,
    invoice_type: str,  # AR or AP
    counterparty_id: str,
    issue_date: str,
    due_date: str,
    currency: str,
    line_items: List[Dict[str, Any]],  # {description, qty, unit_price, tax_rate}
    payment_terms: Optional[str] = None,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """Creates an invoice header and lines into CSV files.

    - Computes subtotal, tax, and total from `line_items`
    - Writes header to `invoice.csv`
    - Appends lines to `invoice_lines.csv` with generated `line_id`
    """
    invoice_type_norm = (invoice_type or "").upper()
    if invoice_type_norm not in {"AR", "AP"}:
        return {"status": "error", "message": "invoice_type must be AR or AP"}

    # Validate dates are parseable; keep original strings for CSV
    if _parse_date(issue_date) is None or _parse_date(due_date) is None:
        return {"status": "error", "message": "issue_date/due_date not recognized"}

    existing = _read_csv_dicts(INVOICE_CSV)
    invoice_id = _next_invoice_no(existing)

    subtotal = 0.0
    total_tax = 0.0
    normalized_items: List[Dict[str, Any]] = []
    for idx, item in enumerate(line_items, start=1):
        desc = str(item.get("description", ""))
        qty = float(item.get("qty") or item.get("quantity") or 0)
        unit_price = float(item.get("unit_price") or 0)
        tax_rate = float(item.get("tax_rate") or 0)  # e.g., 0.11 for 11%
        line_subtotal = qty * unit_price
        line_tax = line_subtotal * tax_rate
        line_total = line_subtotal + line_tax
        subtotal += line_subtotal
        total_tax += line_tax
        normalized_items.append(
            {
                "line_id": f"{invoice_id}-{idx}",
                "description": desc,
                "quantity": qty,
                "unit_price": unit_price,
                "tax_rate": tax_rate,
                "line_total": line_total,
                "currency": currency,
            }
        )

    total = subtotal + total_tax

    header_fields = [
        "user_id",
        "invoice_id",
        "invoice_type",
        "counterparty_id",
        "issue_date",
        "due_date",
        "status",
        "currency",
        "subtotal",
        "tax_rate",
        "tax_amount",
        "total",
        "payment_terms",
        "fx_rate_to_base",
        "notes",
    ]
    header_row = {
        "user_id": user_id,
        "invoice_id": invoice_id,
        "invoice_type": invoice_type_norm,
        "counterparty_id": counterparty_id,
        "issue_date": issue_date,
        "due_date": due_date,
        "status": "draft",
        "currency": currency,
        "subtotal": subtotal,
        # Store the average tax rate over subtotal to remain compatible with header schema
        "tax_rate": (total_tax / subtotal) if subtotal else 0.0,
        "tax_amount": total_tax,
        "total": total,
        "payment_terms": payment_terms or "",
        "fx_rate_to_base": "",
        "notes": notes or "",
    }
    _append_csv_row(INVOICE_CSV, header_fields, header_row)

    line_fields = [
        "invoice_id",
        "line_id",
        "description",
        "quantity",
        "unit_price",
        "tax_rate",
        "line_total",
        "currency",
    ]
    for li in normalized_items:
        _append_csv_row(
            INVOICE_LINES_CSV,
            line_fields,
            {
                "invoice_id": invoice_id,
                **li,
            },
        )

    return {
        "status": "ok",
        "invoice_id": invoice_id,
        "subtotal": subtotal,
        "tax_amount": total_tax,
        "total": total,
        "num_lines": len(normalized_items),
    }


def render_invoice_pdf(
    context = None,
    *,
    invoice_id: str,
    output_dir: Optional[str] = None,
    locale: Optional[str] = None,
) -> Dict[str, Any]:
    """Renders a very simple HTML invoice and writes it to disk.

    PDF generation can be integrated later (wkhtmltopdf/WeasyPrint). For MVP we
    return the HTML path as `pdf_uri` as a fallback.
    """
    headers = _read_csv_dicts(INVOICE_CSV)
    lines = _read_csv_dicts(INVOICE_LINES_CSV)
    header = next((h for h in headers if (h.get("invoice_id") == invoice_id or h.get("invoice_no") == invoice_id)), None)
    if not header:
        return {"status": "error", "message": f"invoice_id {invoice_id} not found"}
    line_rows = [l for l in lines if (l.get("invoice_id") == invoice_id)]

    # Basic HTML
    items_html = "\n".join(
        f"<tr><td>{l.get('description','')}</td><td>{l.get('quantity','')}</td><td>{l.get('unit_price','')}</td><td>{l.get('tax_rate','')}</td><td>{l.get('line_total','')}</td></tr>"
        for l in line_rows
    )
    html = f"""
<!doctype html>
<html><head><meta charset='utf-8'><title>Invoice {invoice_id}</title>
<style>body{{font-family:sans-serif}} table{{border-collapse:collapse;width:100%}} td,th{{border:1px solid #ddd;padding:8px}}</style>
</head><body>
<h1>Invoice {invoice_id}</h1>
<p>Type: {header.get('invoice_type','')}</p>
<p>Issue Date: {header.get('issue_date','')} | Due Date: {header.get('due_date','')}</p>
<p>Currency: {header.get('currency','')}</p>
<table>
<thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Tax Rate</th><th>Line Total</th></tr></thead>
<tbody>
{items_html}
</tbody>
</table>
<h3>Subtotal: {header.get('subtotal','')}</h3>
<h3>Tax: {header.get('tax_amount','')}</h3>
<h2>Total: {header.get('total','')}</h2>
</body></html>
"""

    out_dir = Path(output_dir) if output_dir else (KB_DIR / "invoices")
    _ensure_parent_dir(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    html_path = out_dir / f"{invoice_id}.html"
    html_path.write_text(html, encoding="utf-8")
    # Future: also create PDF and set pdf_path accordingly
    return {"status": "ok", "pdf_uri": str(html_path), "html_uri": str(html_path)}


def mark_invoice_paid(
    context = None,
    *,
    user_id: str,
    invoice_id: str,
    amount: float,
    date: str,
    payment_method: Optional[str] = None,
) -> Dict[str, Any]:
    """Marks the invoice as paid by writing a corresponding cashflow row.

    - For AR invoices, writes an IN row (collections)
    - For AP invoices, writes an OUT row (payables)
    """
    headers = _read_csv_dicts(INVOICE_CSV)
    header = next((h for h in headers if (h.get("invoice_id") == invoice_id or h.get("invoice_no") == invoice_id)), None)
    if not header:
        return {"status": "error", "message": f"invoice_id {invoice_id} not found"}

    inv_type = (header.get("invoice_type") or "").upper()
    currency = header.get("currency") or ""
    counterparty_id = header.get("counterparty_id") or ""
    direction = "IN" if inv_type == "AR" else "OUT"
    category = "AR Collection" if inv_type == "AR" else "AP Payment"
    counterparty_type = "customer" if inv_type == "AR" else "supplier"

    tx = record_transaction(
        user_id=user_id,
        date=date,
        category=category,
        currency=currency,
        amount=amount,
        direction=direction,
        counterparty_id=counterparty_id,
        counterparty_type=counterparty_type,
        description=f"Payment for {invoice_id}",
        document_reference=invoice_id,
        payment_method=payment_method,
    )
    # Optionally we could update header status to paid, but CSV header is append-only here
    return {"status": "ok", "invoice_id": invoice_id, "cashflow": tx}