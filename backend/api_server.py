"""
FastAPI server for plainfigures
Provides REST API endpoints for the frontend to communicate with the backend
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from typing import Optional, List, Dict, Any
import pandas as pd
import openai
import base64
import uvicorn
import os

# Import the financial tools
from src.tools.finance_tools import (
    record_transaction,
    summarize_cashflow,
    load_customers,
    load_suppliers,
    extract_invoice_data_from_image,
    extract_invoice_data_from_pdf,
)

currency_conversion_rates = {
    "SGD": 1.0,
    "MYR": 3.3,
    "THB": 24,
    "IDR": 12633,
    "PHP": 44,
}

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

        
        # Path to cashflow CSV
        csv_path = Path(__file__).parents[1] / "backend" / "database" / "cashflow.csv"
        
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
        # Force fresh import to ensure we get the latest code
        import importlib
        from src.tools import finance_tools
        importlib.reload(finance_tools)
        
        result = finance_tools.summarize_cashflow(
            user_id=user_id,
            lookback_days=lookback_days,
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
        from src.agent import graph
        
        # Process message with the agent
        response = graph.process(request.message)
        
        return {
            "action": "agent_response",
            "result": response,
            "message": "Message processed successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# AI Recommendations endpoint
@app.get("/ai/recommendations")
async def get_ai_recommendations(user_id: Optional[str] = "1"):
    """Generate AI-powered financial recommendations using LangGraph agent"""
    try:
        # Import the AI recommendation generator
        from src.ai_recommendations import generate_financial_recommendations
        
        # Generate recommendations using the LangGraph agent
        recommendations = await generate_financial_recommendations(user_id)
        
        return ApiResponse(success=True, data=recommendations)
    except Exception as e:
        return ApiResponse(success=False, error=str(e))

# User Profile endpoint
@app.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str):
    """Get user profile from CSV"""
    try:
        # Path to user profile CSV
        csv_path = Path(__file__).parent / "database" / "user_sme_profile.csv"
        
        if not csv_path.exists():
            raise HTTPException(status_code=404, detail="User profile data not found")
        
        # Read CSV file
        df = pd.read_csv(csv_path)
        
        # Find user by ID
        user_row = df[df['user_id'].astype(str) == str(user_id)]
        
        if user_row.empty:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Convert to dictionary
        profile = user_row.iloc[0].to_dict()
        
        return ApiResponse(success=True, data=profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Simple AI Recommendations endpoint using OpenAI GPT-4o
@app.get("/ai/openai-recommendations")
async def get_openai_recommendations():
    """Generate simple AI recommendations using GPT-4o"""
    try:

        # Get OpenAI API key
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return ApiResponse(success=False, error="OpenAI API key not configured")
        
        # Load user profile and financial data
        user_data = {}
        try:
            csv_path = Path(__file__).parent / "database" / "user_sme_profile.csv"
            if csv_path.exists():
                df = pd.read_csv(csv_path)
                if not df.empty:
                    user_data = df.iloc[0].to_dict()
        except:
            pass
        
        # Load cashflow data using the same function as /cashflow/summary endpoint
        financial_data = {}
        try:
            from src.tools.finance_tools import summarize_cashflow
            cashflow_summary = summarize_cashflow()
            print(f"Cashflow summary loaded: {cashflow_summary}")
            if cashflow_summary:
                # Extract the totals for easier access
                totals = cashflow_summary.get('totals', {})
                financial_data["cashflow"] = {
                    "total_income": totals.get('in', 0),
                    "total_expenses": totals.get('out', 0), 
                    "net_cashflow": totals.get('net', 0)
                }
        except Exception as e:
            print(f"Error loading cashflow: {e}")
            pass
        
        print(f"Final financial_data: {financial_data}")
        
        # Create prompt for GPT-4o
        cashflow = financial_data.get('cashflow', {})
        total_income = cashflow.get('total_income', 0)
        total_expenses = cashflow.get('total_expenses', 0)
        net_cashflow = cashflow.get('net_cashflow', 0)
        
        prompt = f"""You are a financial advisor analyzing real business data. Based on the following ACTUAL financial data, provide 3 data-driven recommendations with specific reasoning:

BUSINESS PROFILE:
- Company: {user_data.get('company_name', 'Small Business')}
- Industry: {user_data.get('industry', 'General Business')}
- Employees: {user_data.get('employees', 'Unknown')}
- Annual Revenue Target: ${user_data.get('annual_revenue_usd', 0):,}

CURRENT FINANCIAL REALITY (Last 30 days):
- Total Income: ${total_income:,}
- Total Expenses: ${total_expenses:,}
- Net Cashflow: ${net_cashflow:,}
- Cash Burn Rate: ${abs(net_cashflow):,}/month {"(NEGATIVE - losing money)" if net_cashflow < 0 else "(POSITIVE - making profit)"}

CRITICAL ANALYSIS:
{"- WARNING: Company is losing money at " + f"${abs(net_cashflow):,}/month" if net_cashflow < 0 else "- Good: Company is profitable"}
{"- Expense-to-income ratio is " + f"{(total_expenses/total_income*100):.1f}%" if total_income > 0 else "- No income recorded in last 30 days"}

Your recommendations MUST:
1. Reference the actual numbers above
2. Address the specific financial situation (negative/positive cashflow)
3. Be based on the industry context
4. Include data-driven reasoning

Provide 3 recommendations in this JSON format:
{{
  "recommendations": [
    {{
      "title": "Address Immediate Cashflow Issue",
      "description": "Based on your ${net_cashflow:,.2f} monthly loss, here's what to do...",
      "priority": "high|medium|low",
      "action_items": ["Specific action referencing the data", "Another specific action"],
      "data_reasoning": "Because your expenses (${total_expenses:,.2f}) exceed income (${total_income:,.2f}) by ${abs(net_cashflow):,.2f}"
    }},
    {{
      "title": "Revenue Growth Strategy",
      "description": "Given your current ${total_income:,.2f} monthly income...",
      "priority": "high|medium|low",
      "action_items": ["Data-driven action", "Industry-specific action"],
      "data_reasoning": "Your current income needs to increase to match your expense level"
    }},
    {{
      "title": "Expense Optimization",
      "description": "With ${total_expenses:,.2f} in monthly expenses...",
      "priority": "high|medium|low",
      "action_items": ["Specific cost-cutting measure", "Efficiency improvement"],
      "data_reasoning": "Reducing the expense ratio from current levels"
    }}
  ]
}}

Be specific, reference the actual numbers, and provide reasoning based on the data."""

        # Call OpenAI API
        client = openai.OpenAI(api_key=api_key)
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful financial advisor. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        # Parse response
        recommendations_text = response.choices[0].message.content
        print(f"OpenAI response: {recommendations_text}")
        
        # Try to parse as JSON
        import json
        try:
            recommendations_data = json.loads(recommendations_text)
            print("Successfully parsed OpenAI response as JSON")
        except Exception as parse_error:
            print(f"Failed to parse OpenAI response as JSON: {parse_error}")
            print(f"Raw response: {recommendations_text}")
            # Fallback if JSON parsing fails - mark as generic
            recommendations_data = {
                "recommendations": [
                    {
                        "title": "Optimize Cash Flow",
                        "description": "Review and optimize your payment terms",
                        "priority": "high",
                        "action_items": ["Review payment terms", "Contact customers about early payments"],
                        "is_fallback": True
                    },
                    {
                        "title": "Reduce Expenses", 
                        "description": "Identify areas to cut unnecessary costs",
                        "priority": "medium", 
                        "action_items": ["Audit monthly subscriptions", "Negotiate with suppliers"],
                        "is_fallback": True
                    },
                    {
                        "title": "Plan for Next Month",
                        "description": "Prepare for upcoming financial needs",
                        "priority": "medium",
                        "action_items": ["Create monthly budget", "Set aside emergency funds"],
                        "is_fallback": True
                    }
                ]
            }
        
        return ApiResponse(success=True, data=recommendations_data)
        
    except Exception as e:
        return ApiResponse(success=False, error=f"Failed to generate recommendations: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
