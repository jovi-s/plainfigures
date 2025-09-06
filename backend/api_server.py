"""
FastAPI server for plainfigures
Provides REST API endpoints for the frontend to communicate with the backend
"""

import pandas as pd
import openai
import os

from fastapi import FastAPI, HTTPException, File
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from typing import Optional

from src.types.request_types import (
    TransactionRequest,
    FunctionCallRequest,
    ApiResponse,
)

# Import the financial tools
from src.tools.finance_tools import (
    record_transaction,
    summarize_cashflow,
    load_customers,
    load_suppliers,
    extract_invoice_data_from_image,
    extract_invoice_data_from_pdf,
)
from src.tools.openai_recommendations import openai_recommendations

# Global variables for DataFrames and their paths
CASHFLOW_CSV_PATH = Path(__file__).parent / "database" / "cashflow.csv"
USER_PROFILE_CSV_PATH = Path(__file__).parent / "database" / "user_sme_profile.csv"

# Global DataFrames - will be loaded at startup
cashflow_df = None
user_profile_df = None

def load_dataframes():
    """Load all DataFrames from CSV files at startup"""
    global cashflow_df, user_profile_df
    
    try:
        # Load cashflow data
        if CASHFLOW_CSV_PATH.exists():
            cashflow_df = pd.read_csv(CASHFLOW_CSV_PATH)
            print(f"Loaded cashflow data: {len(cashflow_df)} records")
        else:
            cashflow_df = pd.DataFrame()
            print("Cashflow CSV not found, using empty DataFrame")
    except Exception as e:
        print(f"Error loading cashflow data: {e}")
        cashflow_df = pd.DataFrame()
    
    try:
        # Load user profile data
        if USER_PROFILE_CSV_PATH.exists():
            user_profile_df = pd.read_csv(USER_PROFILE_CSV_PATH)
            print(f"Loaded user profile data: {len(user_profile_df)} records")
        else:
            user_profile_df = pd.DataFrame()
            print("User profile CSV not found, using empty DataFrame")
    except Exception as e:
        print(f"Error loading user profile data: {e}")
        user_profile_df = pd.DataFrame()


app = FastAPI(
    title="plainfigures API",
    description="REST API for SME Finance Management",
    version="1.0.0"
)

# Load DataFrames at startup
load_dataframes()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {"status": "healthy", "message": "plainfigures API is up and running", "version": "1.0.0"}

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
        global cashflow_df
        
        print(f"GET /transactions called with user_id: {user_id}")
        print(f"cashflow_df is None: {cashflow_df is None}")
        
        # Use preloaded DataFrame
        if cashflow_df is None or cashflow_df.empty:
            print("No cashflow data available, returning empty list")
            return ApiResponse(success=True, data=[])
        
        print(f"cashflow_df shape: {cashflow_df.shape}")
        print(f"cashflow_df columns: {list(cashflow_df.columns)}")
        
        df = cashflow_df.copy()
        
        # Filter by user_id if provided
        if user_id:
            df = df[df['user_id'].astype(str) == str(user_id)]
            print(f"Filtered df shape: {df.shape}")

        # Convert to list of dictionaries
        transactions = df.to_dict('records')
        print(f"Returning {len(transactions)} transactions")
        
        return ApiResponse(success=True, data=transactions)
    except Exception as e:
        print(f"Error in get_transactions: {e}")
        return ApiResponse(success=False, error=str(e))

# User Profile endpoint
@app.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str):
    """Get user profile from CSV"""
    try:
        global user_profile_df
        
        # Use preloaded DataFrame
        if user_profile_df is None or user_profile_df.empty:
            raise HTTPException(status_code=404, detail="User profile data not found")
        
        # Find user by ID
        user_row = user_profile_df[user_profile_df['user_id'].astype(str) == str(user_id)]
        
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
        global user_profile_df
        recommendations_data = openai_recommendations(user_profile_df)
        return ApiResponse(success=True, data=recommendations_data)
        
    except Exception as e:
        return ApiResponse(success=False, error=f"Failed to generate recommendations: {str(e)}")
