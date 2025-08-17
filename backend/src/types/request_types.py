from pydantic import BaseModel
from typing import Optional, List, Dict, Any


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