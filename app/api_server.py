"""
FastAPI server for plainfigures
Provides REST API endpoints for the frontend to communicate with the backend
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import base64
import uvicorn
import os

# Import the financial tools
from financial_advisor.tools.finance_tools import (
    record_transaction,
    summarize_cashflow,
    create_invoice,
    mark_invoice_paid,
    render_invoice_pdf,
    load_customers,
    load_suppliers,
    extract_invoice_data_from_image,
    extract_invoice_data_from_pdf,
)

app = FastAPI(
    title="plainfigures API",
    description="REST API for SME Finance Management",
    version="1.0.0"
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class TransactionRequest(BaseModel):
    user_id: str
    date: str
    category: str
    currency: str
    amount: float
    direction: str
    counterparty_id: Optional[str] = None
    counterparty_type: Optional[str] = None
    description: Optional[str] = None
    document_reference: Optional[str] = None
    tax_amount: Optional[float] = None
    payment_method: Optional[str] = None

class InvoiceLineItem(BaseModel):
    description: str
    quantity: float
    unit_price: float
    tax_rate: float

class InvoiceRequest(BaseModel):
    user_id: str
    invoice_type: str
    counterparty_id: str
    issue_date: str
    due_date: str
    currency: str
    line_items: List[InvoiceLineItem]
    payment_terms: Optional[str] = None
    notes: Optional[str] = None

class PaymentRequest(BaseModel):
    user_id: str
    amount: float
    date: str
    payment_method: Optional[str] = None

class FunctionCallRequest(BaseModel):
    function_name: str
    parameters: Dict[str, Any]

class AgentMessageRequest(BaseModel):
    message: str
    user_id: Optional[str] = "user_1"

class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    error: Optional[str] = None

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "plainfigures API is running"}

# Function call endpoint (for direct tool access)
@app.post("/functions/call")
async def call_function(request: FunctionCallRequest):
    """Call backend functions directly with parameters"""
    try:
        function_name = request.function_name
        parameters = request.parameters

        # Map function names to actual functions
        function_map = {
            "record_transaction": record_transaction,
            "summarize_cashflow": summarize_cashflow,
            "create_invoice": create_invoice,
            "mark_invoice_paid": mark_invoice_paid,
            "render_invoice_pdf": render_invoice_pdf,
            "load_customers": load_customers,
            "load_suppliers": load_suppliers,
            "extract_invoice_data_from_image": extract_invoice_data_from_image,
            "extract_invoice_data_from_pdf": extract_invoice_data_from_pdf,
        }

        if function_name not in function_map:
            raise HTTPException(status_code=400, detail=f"Unknown function: {function_name}")

        func = function_map[function_name]
        
        # Call the function with parameters
        if parameters:
            result = func(**parameters)
        else:
            result = func()

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Transaction endpoints
@app.post("/transactions")
async def create_transaction(request: TransactionRequest):
    """Create a new transaction"""
    try:
        result = record_transaction(
            user_id=request.user_id,
            date=request.date,
            category=request.category,
            currency=request.currency,
            amount=request.amount,
            direction=request.direction,
            counterparty_id=request.counterparty_id,
            counterparty_type=request.counterparty_type,
            description=request.description,
            document_reference=request.document_reference,
            tax_amount=request.tax_amount,
            payment_method=request.payment_method,
        )
        
        return ApiResponse(success=True, data=result)
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

@app.get("/transactions")
async def get_transactions(user_id: Optional[str] = None):
    """Get all transactions"""
    try:
        # Import pandas to read the CSV file
        import pandas as pd
        from pathlib import Path
        
        # Path to cashflow CSV
        csv_path = Path(__file__).parent / "financial_advisor" / "kb" / "cashflow.csv"
        
        if not csv_path.exists():
            return ApiResponse(success=True, data=[])
        
        # Read CSV file
        df = pd.read_csv(csv_path)
        
        # Filter by user_id if provided
        if user_id:
            df = df[df['user_id'].astype(str) == str(user_id)]
        
        # Convert to list of dictionaries
        transactions = df.to_dict('records')
        
        return ApiResponse(success=True, data=transactions)
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

@app.get("/cashflow/summary")
async def get_cashflow_summary(user_id: Optional[str] = None, lookback_days: int = 30):
    """Get cashflow summary"""
    try:
        result = summarize_cashflow(
            user_id=user_id,
            lookback_days=lookback_days,
        )
        
        return ApiResponse(success=True, data=result)
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

# Invoice endpoints
@app.post("/invoices")
async def create_invoice_endpoint(request: InvoiceRequest):
    """Create a new invoice"""
    try:
        # Convert line items to the expected format
        line_items = []
        for item in request.line_items:
            line_items.append({
                "description": item.description,
                "qty": item.quantity,
                "unit_price": item.unit_price,
                "tax_rate": item.tax_rate,
            })

        result = create_invoice(
            user_id=request.user_id,
            invoice_type=request.invoice_type,
            counterparty_id=request.counterparty_id,
            issue_date=request.issue_date,
            due_date=request.due_date,
            currency=request.currency,
            line_items=line_items,
            payment_terms=request.payment_terms,
            notes=request.notes,
        )
        
        return ApiResponse(success=True, data=result)
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

@app.post("/invoices/{invoice_id}/pay")
async def mark_invoice_paid_endpoint(invoice_id: str, request: PaymentRequest):
    """Mark an invoice as paid"""
    try:
        result = mark_invoice_paid(
            user_id=request.user_id,
            invoice_id=invoice_id,
            amount=request.amount,
            date=request.date,
            payment_method=request.payment_method,
        )
        
        return ApiResponse(success=True, data=result)
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

@app.post("/invoices/{invoice_id}/pdf")
async def generate_invoice_pdf_endpoint(invoice_id: str, locale: Optional[str] = None):
    """Generate PDF for an invoice"""
    try:
        result = render_invoice_pdf(
            invoice_id=invoice_id,
            locale=locale,
        )
        
        return ApiResponse(success=True, data=result)
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

# Customer/Supplier endpoints
@app.get("/customers")
async def get_customers():
    """Get all customers"""
    try:
        result = load_customers()
        return ApiResponse(success=True, data=result.get("customers", []))
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

@app.get("/suppliers")
async def get_suppliers():
    """Get all suppliers"""
    try:
        result = load_suppliers()
        return ApiResponse(success=True, data=result.get("suppliers", []))
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

# File upload endpoints
@app.post("/upload/image")
async def upload_invoice_image(file: UploadFile = File(...)):
    """Upload and process invoice image"""
    try:
        # Read file content and convert to base64
        file_content = await file.read()
        b64_image = base64.b64encode(file_content).decode('utf-8')
        
        result = extract_invoice_data_from_image(b64_image)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/pdf")
async def upload_invoice_pdf(file: UploadFile = File(...)):
    """Upload and process invoice PDF"""
    try:
        # Read file content as bytes
        file_content = await file.read()
        
        result = extract_invoice_data_from_pdf(file_content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Agent messaging endpoint
@app.post("/agent/message")
async def send_agent_message(request: AgentMessageRequest):
    """Send message to financial coordinator agent"""
    try:
        # Import the financial coordinator
        from financial_advisor.agent import financial_coordinator
        
        # Process message with the agent
        response = financial_coordinator.process(request.message)
        
        return {
            "action": "agent_response",
            "result": response,
            "message": "Message processed successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
