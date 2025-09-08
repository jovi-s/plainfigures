"""
FastAPI server for plainfigures
Provides REST API endpoints for the frontend to communicate with the backend
"""

import pandas as pd
import openai
import os
import re

from fastapi import FastAPI, HTTPException, File
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import HumanMessage
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
from src.tools.enhanced_recommendations import generate_enhanced_recommendations
from src.tools.chart_generator import generate_charts_for_recommendations
from src.agent.market_research import graph
from src.utils.cache import app_cache

def clean_market_research_text(text: str) -> str:
    """Clean up market research text by removing garbled URLs and citations"""
    # Remove URLs with grounding API references that contain encoded content
    text = re.sub(r'\[([^\]]+)\]\(https://vertexaisearch\.cloud\.google\.com/grounding-api-redirect/[^)]+\)', r'[\1]', text)
    
    # Remove any remaining long encoded strings that look like base64
    text = re.sub(r'[A-Za-z0-9+/=]{50,}', '', text)
    
    # Clean up extra spaces and newlines
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    return text

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
    """Generate simple AI recommendations using GPT-4o with caching"""
    try:
        global user_profile_df
        
        # Create cache key based on user profile and financial data hash
        # This ensures cache invalidation when underlying data changes
        cache_key = "openai_recommendations"
        
        # Try to get from cache first
        cached_result = app_cache.get(cache_key)
        if cached_result:
            print("Returning cached OpenAI recommendations")
            return ApiResponse(success=True, data=cached_result)
        
        # Generate fresh recommendations
        print("Generating fresh OpenAI recommendations")
        recommendations_data = openai_recommendations(user_profile_df)
        
        # Cache the result (only if successful and contains recommendations)
        if recommendations_data and hasattr(recommendations_data, 'recommendations') and recommendations_data.recommendations:
            app_cache.set(cache_key, recommendations_data, ttl_seconds=1800)  # 30 minutes
        
        return ApiResponse(success=True, data=recommendations_data)
        
    except Exception as e:
        return ApiResponse(success=False, error=f"Failed to generate recommendations: {str(e)}")

@app.get("/ai/market-research")
async def get_market_research():
    """Generate market research using LangGraph with caching"""
    try:
        user_information = {
            "industry": "beauty_and_personal_care",
            "location": "Singapore",
            "company_size": "50-100",
            "company_type": "hair_salon",
            "company_stage": "growth",
            "company_revenue": "500000",
            "company_employees": "65",
        }
        
        # Create cache key based on user information to ensure appropriate cache invalidation
        cache_key = f"market_research_{user_information['company_type']}_{user_information['location']}_{user_information['industry']}"
        
        # Try to get from cache first
        cached_result = app_cache.get(cache_key)
        if cached_result:
            print("Returning cached market research")
            return ApiResponse(success=True, data=cached_result)
        
        # Generate fresh market research
        print("Generating fresh market research")
        MARKET_RESEARCH_PROMPT = f"""
Perform comprehensive economic and market research for a {user_information['company_type']} business 
in the {user_information['industry']} industry located in {user_information['location']}. 
The company is at the {user_information['company_stage']} stage with {user_information['company_employees']} 
employees and {user_information['company_revenue']} in revenue.

Focus on actionable insights to grow this business including:
1. Economic trends and opportunities in {user_information['location']} that could benefit this business
2. Market size and growth potential for {user_information['industry']} services
3. Competitive landscape analysis and positioning opportunities
4. Customer demand patterns and emerging market segments
5. Economic factors affecting pricing strategies and profitability
6. Investment opportunities and funding landscape for {user_information['company_stage']} companies
7. Regulatory and economic policy impacts on business growth
8. Supply chain and operational cost optimization opportunities
9. Technology adoption trends that could drive business expansion
10. Strategic partnerships and market entry opportunities

Provide specific, data-driven recommendations that this business can implement to accelerate growth 
and capitalize on economic opportunities in their market.

Your final answer should take all the learnings from the previous steps and provide a comprehensive report on the market research in 2 short paragraphs.
"""
        
        result = graph.invoke({
            "messages": [HumanMessage(content=MARKET_RESEARCH_PROMPT)], 
            "max_research_loops": 3, 
            "initial_search_query_count": 3
        })
        raw_output = result["messages"][-1].content
        
        # Clean up the market research text to remove garbled URLs
        output = clean_market_research_text(raw_output)
        
        # Cache the result if it's substantial (more than 100 characters to avoid caching errors)
        if output and len(output) > 100:
            app_cache.set(cache_key, output, ttl_seconds=1800)  # 30 minutes
        
        return ApiResponse(success=True, data=output)
        
    except Exception as e:
        return ApiResponse(success=False, error=f"Failed to generate market research: {str(e)}")

# Cache management endpoints
@app.get("/cache/stats")
async def get_cache_stats():
    """Get cache statistics for debugging"""
    stats = app_cache.stats()
    return ApiResponse(success=True, data=stats)

@app.post("/cache/clear")
async def clear_cache():
    """Clear all cache entries"""
    app_cache.clear()
    return ApiResponse(success=True, data={"message": "Cache cleared successfully"})

@app.delete("/cache/{cache_key}")
async def delete_cache_entry(cache_key: str):
    """Delete a specific cache entry"""
    deleted = app_cache.delete(cache_key)
    if deleted:
        return ApiResponse(success=True, data={"message": f"Cache entry '{cache_key}' deleted"})
    else:
        return ApiResponse(success=False, error=f"Cache entry '{cache_key}' not found")

@app.post("/cache/cleanup")
async def cleanup_expired_cache():
    """Remove expired cache entries"""
    removed_count = app_cache.cleanup_expired()
    return ApiResponse(success=True, data={"message": f"Removed {removed_count} expired cache entries"})

# AI Charts and Visualization endpoint
@app.get("/ai/charts")
async def get_ai_charts():
    """Generate AI-powered charts and forecasts with caching"""
    try:
        global cashflow_df, user_profile_df
        
        # Create cache key
        cache_key = "ai_charts_visualization"
        
        # Try to get from cache first
        cached_result = app_cache.get(cache_key)
        if cached_result:
            print("Returning cached AI charts")
            return ApiResponse(success=True, data=cached_result)
        
        # Generate fresh charts and insights
        print("Generating fresh AI charts and forecasts")
        
        # Prepare user profile data
        user_profile = {}
        if user_profile_df is not None and not user_profile_df.empty:
            user_profile = user_profile_df.iloc[0].to_dict()
        
        # Generate charts using the cashflow data
        if cashflow_df is None or cashflow_df.empty:
            return ApiResponse(success=False, error="No cashflow data available for chart generation")
        
        charts_data = generate_charts_for_recommendations(cashflow_df, user_profile)
        
        # Cache the result (charts are expensive to generate)
        app_cache.set(cache_key, charts_data, ttl_seconds=3600)  # 1 hour cache
        
        return ApiResponse(success=True, data=charts_data)
        
    except Exception as e:
        print(f"Error generating AI charts: {e}")
        return ApiResponse(success=False, error=f"Failed to generate charts: {str(e)}")


# Enhanced AI Recommendations with Market Research Integration
@app.post("/ai/enhanced-recommendations")
async def get_enhanced_recommendations(market_research: dict):
    """Generate enhanced AI recommendations combining financial data with market research"""
    try:
        global cashflow_df, user_profile_df
        
        # Extract market research data from request
        market_data = market_research.get("market_research_data", "")
        if not market_data.strip():
            return ApiResponse(success=False, error="Market research data is required")
        
        # Create cache key based on market data hash
        import hashlib
        market_hash = hashlib.md5(market_data.encode()).hexdigest()[:8]
        cache_key = f"enhanced_recommendations_{market_hash}"
        
        # Try to get from cache first
        cached_result = app_cache.get(cache_key)
        if cached_result:
            print(f"Cache HIT: {cache_key}")
            return ApiResponse(success=True, data=cached_result)
        
        print(f"Cache MISS: {cache_key}")
        print(f"Generating enhanced recommendations with market intelligence...")
        
        # First get existing AI recommendations from financial data
        print("Getting existing AI recommendations...")
        existing_ai_recs_data = openai_recommendations(user_profile_df)
        existing_recommendations = existing_ai_recs_data.get("recommendations", []) if existing_ai_recs_data else []
        print(f"Found {len(existing_recommendations)} existing AI recommendations")
        
        # Generate enhanced recommendations combining existing recs with market research
        enhanced_recommendations = await generate_enhanced_recommendations(
            cashflow_df=cashflow_df,
            user_profile_df=user_profile_df, 
            market_research_data=market_data,
            existing_ai_recommendations=existing_recommendations
        )
        
        # Cache the result (expire in 2 hours since it's contextual)
        app_cache.set(cache_key, enhanced_recommendations, ttl_seconds=7200)  # 2 hours
        print(f"Cache SET: {cache_key}")
        
        return ApiResponse(success=True, data=enhanced_recommendations)
        
    except Exception as e:
        print(f"Error in enhanced recommendations endpoint: {str(e)}")
        return ApiResponse(success=False, error=f"Failed to generate enhanced recommendations: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)