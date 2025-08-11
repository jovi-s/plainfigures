"""Streamlit app for the SME Finance Assistant (MVP).

Features:
- Upload invoice image (JPEG/PNG) and PDF
- Track cash flow entries in a CSV-backed ledger
- Generate invoices and store to CSV
- Dashboard to review expenses by week/month/quarter/year
"""

from __future__ import annotations

import base64
import json
from datetime import datetime, date
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
import streamlit as st

# Ensure local imports resolve whether launched from project root or `app/`
import sys

APP_DIR = Path(__file__).resolve().parent
if str(APP_DIR) not in sys.path:
    sys.path.append(str(APP_DIR))

from financial_advisor.tools.finance_tools import (  # noqa: E402
    extract_invoice_data_from_image,
    extract_invoice_data_from_pdf,
    categorize_expense,
)


KB_DIR = APP_DIR / "financial_advisor" / "kb"
CASHFLOW_CSV = KB_DIR / "cashflow.csv"
INVOICE_CSV = KB_DIR / "invoice.csv"


def load_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    return pd.read_csv(path)


def save_cashflow_row(row: Dict[str, Any]) -> None:
    df_existing = load_csv(CASHFLOW_CSV)
    df_new = pd.DataFrame([row])
    df_out = pd.concat([df_existing, df_new], ignore_index=True)
    df_out.to_csv(CASHFLOW_CSV, index=False)


def save_invoice_row(row: Dict[str, Any]) -> None:
    df_existing = load_csv(INVOICE_CSV)
    df_new = pd.DataFrame([row])
    df_out = pd.concat([df_existing, df_new], ignore_index=True)
    df_out.to_csv(INVOICE_CSV, index=False)


def generate_txn_id() -> str:
    return f"TXN-{datetime.now().strftime('%Y%m%d-%H%M%S')}"


def generate_invoice_id(existing: Optional[pd.DataFrame]) -> str:
    if existing is None or existing.empty:
        return "INV-0001"
    try:
        nums = (
            existing["invoice_id"].astype(str).str.extract(r"(\d+)")[0].dropna().astype(int)
        )
        next_num = (nums.max() or 0) + 1
    except Exception:
        next_num = 1
    return f"INV-{next_num:04d}"


def render_upload_tab() -> None:
    st.subheader("Upload Invoice")

    col1, col2 = st.columns(2)
    with col1:
        img_file = st.file_uploader(
            "Upload invoice image", type=["jpg", "jpeg", "png"], accept_multiple_files=False
        )
        if img_file is not None:
            st.image(img_file, caption="Preview", use_column_width=True)
            img_bytes = img_file.read()
            b64 = base64.b64encode(img_bytes).decode("utf-8")
            result = extract_invoice_data_from_image(b64)
            st.write("Extracted (editable):")
            invoice_data = result.get("invoice_data", {})
            st.json(invoice_data)

            with st.form("confirm_from_image"):
                default_desc = (
                    json.dumps(invoice_data) if isinstance(invoice_data, dict) else str(invoice_data)
                )
                direction = st.selectbox("Direction", ["OUT", "IN"], index=0)
                amount = st.number_input("Amount", min_value=0.0, step=0.01, value=0.0)
                currency = st.text_input("Currency", value="SGD")
                counterparty = st.text_input("Counterparty", value="")
                description = st.text_area("Description", value=default_desc)
                category = categorize_expense(description)
                category = st.text_input("Category", value=category)
                payment_method = st.text_input("Payment Method", value="Bank Transfer")
                submitted = st.form_submit_button("Add to Cashflow")
                if submitted:
                    row = {
                        "date": date.today().isoformat(),
                        "category": category,
                        "amount": f"{amount:.2f}",
                        "direction": direction,
                        "counterparty_name": counterparty,
                        "transaction_id": generate_txn_id(),
                        "description": description,
                        "document_reference": img_file.name,
                        "tax_amount": "0.00",
                        "currency": currency,
                        "payment_method": payment_method,
                        "created_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "counterparty_tax_id": "",
                    }
                    save_cashflow_row(row)
                    st.success("Added to cashflow.")

    with col2:
        pdf_file = st.file_uploader(
            "Upload invoice PDF", type=["pdf"], accept_multiple_files=False
        )
        if pdf_file is not None:
            pdf_bytes = pdf_file.read()
            result = extract_invoice_data_from_pdf(pdf_bytes)
            st.write("Extracted text (editable):")
            raw = result.get("invoice_data", {}).get("raw_text", "")
            with st.form("confirm_from_pdf"):
                direction = st.selectbox("Direction", ["OUT", "IN"], index=0, key="dir_pdf")
                amount = st.number_input(
                    "Amount", min_value=0.0, step=0.01, value=0.0, key="amt_pdf"
                )
                currency = st.text_input("Currency", value="SGD", key="cur_pdf")
                counterparty = st.text_input("Counterparty", value="", key="cp_pdf")
                description = st.text_area("Description", value=raw, key="desc_pdf")
                category = categorize_expense(description)
                category = st.text_input("Category", value=category, key="cat_pdf")
                payment_method = st.text_input(
                    "Payment Method", value="Bank Transfer", key="pm_pdf"
                )
                submitted = st.form_submit_button("Add to Cashflow from PDF")
                if submitted:
                    row = {
                        "date": date.today().isoformat(),
                        "category": category,
                        "amount": f"{amount:.2f}",
                        "direction": direction,
                        "counterparty_name": counterparty,
                        "transaction_id": generate_txn_id(),
                        "description": description,
                        "document_reference": pdf_file.name,
                        "tax_amount": "0.00",
                        "currency": currency,
                        "payment_method": payment_method,
                        "created_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "counterparty_tax_id": "",
                    }
                    save_cashflow_row(row)
                    st.success("Added to cashflow.")


def render_cashflow_tab() -> None:
    st.subheader("Cashflow Ledger")

    df = load_csv(CASHFLOW_CSV)
    if not df.empty:
        st.dataframe(df, use_container_width=True)
    else:
        st.info("No transactions yet.")

    with st.expander("Add Manual Transaction"):
        with st.form("add_txn_form"):
            c1, c2, c3 = st.columns(3)
            with c1:
                t_date = st.date_input("Date", value=date.today())
                direction = st.selectbox("Direction", ["OUT", "IN"])  
                amount = st.number_input("Amount", min_value=0.0, step=0.01)
            with c2:
                currency = st.text_input("Currency", value="SGD")
                category = st.text_input("Category", value="Miscellaneous")
                counterparty = st.text_input("Counterparty", value="")
            with c3:
                payment_method = st.text_input("Payment Method", value="Bank Transfer")
                tax_amount = st.number_input(
                    "Tax Amount", min_value=0.0, step=0.01, value=0.0
                )
                doc_ref = st.text_input("Document Ref", value="")
            description = st.text_area("Description", value="")
            submitted = st.form_submit_button("Add Transaction")
            if submitted:
                row = {
                    "date": t_date.isoformat(),
                    "category": category,
                    "amount": f"{amount:.2f}",
                    "direction": direction,
                    "counterparty_name": counterparty,
                    "transaction_id": generate_txn_id(),
                    "description": description,
                    "document_reference": doc_ref,
                    "tax_amount": f"{tax_amount:.2f}",
                    "currency": currency,
                    "payment_method": payment_method,
                    "created_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "counterparty_tax_id": "",
                }
                save_cashflow_row(row)
                st.success("Transaction added.")


def render_invoices_tab() -> None:
    st.subheader("Generate Invoice")

    invoices_df = load_csv(INVOICE_CSV)
    new_invoice_id = generate_invoice_id(
        invoices_df if not invoices_df.empty else None
    )

    with st.form("invoice_form"):
        c1, c2 = st.columns(2)
        with c1:
            invoice_id = st.text_input("Invoice ID", value=new_invoice_id)
            issue_date = st.date_input("Issue Date", value=date.today())
            due_date = st.date_input("Due Date", value=date.today())
            invoice_type = st.selectbox("Type", ["sale", "service"], index=0)
            currency = st.text_input("Currency", value="SGD")
            tax_rate = st.number_input(
                "Tax Rate", min_value=0.0, max_value=1.0, step=0.01, value=0.08
            )
        with c2:
            vendor_name = st.text_input("Your Company", value="Sunrise Trading Co")
            vendor_address = st.text_area("Your Address", value="Singapore")
            vendor_tax_id = st.text_input("Your Tax ID", value="")
            client_name = st.text_input("Customer Name", value="")
            client_address = st.text_area("Customer Address", value="")
            client_tax_id = st.text_input("Customer Tax ID", value="")

        st.markdown("Line Items")
        items: List[Dict[str, Any]] = []
        for i in range(1, 6):
            with st.expander(f"Item {i}"):
                desc = st.text_input(
                    f"Description {i}", value="", key=f"desc_{i}"
                )
                qty = st.number_input(
                    f"Qty {i}", min_value=0, value=0, step=1, key=f"qty_{i}"
                )
                unit_price = st.number_input(
                    f"Unit Price {i}", min_value=0.0, value=0.0, step=0.01, key=f"price_{i}"
                )
                if qty > 0 and unit_price > 0 and desc:
                    items.append(
                        {
                            "desc": desc,
                            "qty": qty,
                            "unit_price": unit_price,
                            "tax_rate": tax_rate,
                        }
                    )

        subtotal = sum(it["qty"] * it["unit_price"] for it in items)
        tax_amount = subtotal * tax_rate
        total = subtotal + tax_amount

        c3, c4, c5 = st.columns(3)
        with c3:
            st.metric("Subtotal", f"{subtotal:,.2f} {currency}")
        with c4:
            st.metric("Tax", f"{tax_amount:,.2f} {currency}")
        with c5:
            st.metric("Total", f"{total:,.2f} {currency}")

        payment_terms = st.text_input("Payment Terms", value="Net 30")
        notes = st.text_area("Notes", value="")

        submitted = st.form_submit_button("Save Invoice")
        if submitted:
            row = {
                "invoice_id": invoice_id,
                "invoice_type": invoice_type,
                "issue_date": issue_date.isoformat(),
                "due_date": due_date.isoformat(),
                "vendor_name": vendor_name,
                "vendor_address": vendor_address,
                "vendor_tax_id": vendor_tax_id,
                "client_name": client_name,
                "client_address": client_address,
                "client_tax_id": client_tax_id,
                "line_items": json.dumps(items),
                "subtotal": subtotal,
                "tax_rate": tax_rate,
                "tax_amount": tax_amount,
                "total": total,
                "payment_terms": payment_terms,
                "notes": notes,
            }
            save_invoice_row(row)
            st.success(f"Invoice {invoice_id} saved.")

    st.divider()
    existing = load_csv(INVOICE_CSV)
    if not existing.empty:
        st.dataframe(existing.tail(20), use_container_width=True)


def render_dashboard_tab() -> None:
    st.subheader("Expenses Dashboard")
    df = load_csv(CASHFLOW_CSV)
    if df.empty:
        st.info("No transactions to summarize.")
        return
    # Ensure types
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"])  # remove bad dates
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    df_out = df[df["direction"].str.upper() == "OUT"].copy()

    period = st.selectbox("Group by", ["Week", "Month", "Quarter", "Year"], index=1)
    freq_map = {"Week": "W", "Month": "M", "Quarter": "Q", "Year": "Y"}
    freq = freq_map[period]

    grouped = (
        df_out.set_index("date").groupby([pd.Grouper(freq=freq), "category"]) ["amount"].sum().reset_index()
    )
    st.write("Aggregated expenses:")
    st.dataframe(grouped, use_container_width=True)

    try:
        st.bar_chart(grouped, x="date", y="amount", color="category")
    except Exception:
        pass


def main() -> None:
    st.set_page_config(page_title="SME Finance Assistant", layout="wide")
    st.title("SME Finance Assistant")
    st.caption("Upload invoices, track cashflow, and generate invoices.")

    tabs = st.tabs(["Upload", "Cashflow", "Invoices", "Dashboard"])
    with tabs[0]:
        render_upload_tab()
    with tabs[1]:
        render_cashflow_tab()
    with tabs[2]:
        render_invoices_tab()
    with tabs[3]:
        render_dashboard_tab()


if __name__ == "__main__":
    main()

