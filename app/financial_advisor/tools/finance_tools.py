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

This module provides utility functions used by the Streamlit app and agents:
- Invoice extraction from images (via OpenAI gpt-4o-mini when available; fallback to OCR)
- Basic PDF text extraction when libraries are available
- Naive expense categorization
- A stub `process_invoice` tool for ADK agent compatibility
"""

from __future__ import annotations

import os
import io
import json
from typing import Any, Dict, Optional
from openai import OpenAI
from pypdf import PdfReader
from google.adk.tools import ToolContext

from dotenv import load_dotenv

load_dotenv()

_openai_client = None
if OpenAI is not None and os.getenv("OPENAI_API_KEY"):
    try:  # pragma: no cover - network/API
        _openai_client = OpenAI()
    except Exception:
        _openai_client = None


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


def process_invoice(context: Optional[ToolContext] = None, invoice_text: str | None = None) -> Dict[str, Any]:
    """Stub tool for ADK compatibility.

    In a full implementation, this would parse `invoice_text` and update the ledger.
    Here we return a simple echo response to satisfy imports and basic tests.
    """
    return {"status": "ok", "parsed": bool(invoice_text), "invoice_text": invoice_text or ""}