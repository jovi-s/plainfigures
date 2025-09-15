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
from src.tools.rag_service import get_rag_service
from src.agent.market_research import graph
from src.utils.cache import app_cache
from src.utils.db import init_db, save_openai_recommendations, save_market_research, save_enhanced_recommendations
from src.tools.user_management import (
    create_user_profile,
    update_user_profile,
    get_user_profile,
    authenticate_user,
    check_user_exists
)
from src.tools.permissions import (
    authenticate_user as auth_user,
    get_user_permissions,
    check_permission,
    get_all_users,
    create_user_account,
    update_user_permissions,
    get_user_by_id
)

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
# Initialize SQLite DB for memory persistence
try:
    init_db()
    print("SQLite memory DB initialized")
except Exception as e:
    print(f"Failed to initialize SQLite DB: {e}")

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
        
        # Persist and cache
        if recommendations_data:
            try:
                user_context = user_profile_df.iloc[0].to_dict() if user_profile_df is not None and not user_profile_df.empty else {}
                save_openai_recommendations(recommendations_data, cache_key=cache_key, user_context=user_context)
            except Exception as db_err:
                print(f"Failed to persist OpenAI recommendations: {db_err}")
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
        
        # Persist and cache if substantial (more than 100 chars to avoid caching errors)
        if output and len(output) > 100:
            try:
                save_market_research(output_text=output, cache_key=cache_key, prompt_context="market_research_prompt")
            except Exception as db_err:
                print(f"Failed to persist market research: {db_err}")
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
async def get_ai_charts(
    time_range: str = "30d",
    scenario: str = "current"
):
    """Generate AI-powered charts and forecasts with caching"""
    try:
        global cashflow_df, user_profile_df
        
        # Create cache key with parameters
        cache_key = f"ai_charts_visualization_{time_range}_{scenario}"
        
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
        
        charts_data = generate_charts_for_recommendations(cashflow_df, user_profile, time_range, scenario)
        
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
        
        # Persist and cache (expire in 2 hours since it's contextual)
        app_cache.set(cache_key, enhanced_recommendations, ttl_seconds=7200)  # 2 hours
        print(f"Cache SET: {cache_key}")
        try:
            user_context = user_profile_df.iloc[0].to_dict() if user_profile_df is not None and not user_profile_df.empty else {}
            save_enhanced_recommendations(
                enhanced_recommendations,
                cache_key=cache_key,
                market_hash=market_hash,
                user_context=user_context,
            )
        except Exception as db_err:
            print(f"Failed to persist enhanced recommendations: {db_err}")
        
        return ApiResponse(success=True, data=enhanced_recommendations)
        
    except Exception as e:
        print(f"Error in enhanced recommendations endpoint: {str(e)}")
        return ApiResponse(success=False, error=f"Failed to generate enhanced recommendations: {str(e)}")


# RAG System Endpoints for Chatbot Integration
@app.post("/rag/query")
async def rag_query(request: dict):
    """Query the RAG system for business knowledge and regulatory information"""
    try:
        question = request.get("question", "").strip()
        user_context = request.get("user_context", {})
        
        if not question:
            return ApiResponse(success=False, error="Question is required")
        
        # Get RAG service and query
        rag_service = get_rag_service()
        result = rag_service.query(question, user_context)
        
        return ApiResponse(success=result["success"], data=result)
        
    except Exception as e:
        print(f"Error querying RAG system: {str(e)}")
        return ApiResponse(success=False, error=f"Error querying RAG system: {str(e)}")


@app.get("/rag/documents")
async def get_rag_documents():
    """Get information about indexed documents in the RAG system"""
    try:
        rag_service = get_rag_service()
        stats = rag_service.get_document_stats()
        
        return ApiResponse(success=True, data=stats)
        
    except Exception as e:
        print(f"Error getting document stats: {str(e)}")
        return ApiResponse(success=False, error=f"Error getting document stats: {str(e)}")


@app.post("/rag/rebuild")
async def rebuild_rag_index():
    """Rebuild the RAG index from documents"""
    try:
        rag_service = get_rag_service()
        success = rag_service.build_index()
        
        if success:
            return ApiResponse(success=True, data={"message": "RAG index rebuilt successfully"})
        else:
            return ApiResponse(success=False, error="Failed to rebuild RAG index")
        
    except Exception as e:
        print(f"Error rebuilding RAG index: {str(e)}")
        return ApiResponse(success=False, error=f"Error rebuilding RAG index: {str(e)}")


# User Authentication and Registration Endpoints
@app.post("/auth/register")
async def register_user(request: dict):
    """Register a new user with profile data"""
    try:
        email = request.get("email", "").strip()
        password = request.get("password", "").strip()
        company_name = request.get("company_name", "").strip()
        owner_name = request.get("owner_name", "").strip()
        
        if not all([email, password, company_name, owner_name]):
            return ApiResponse(success=False, error="Email, password, company name, and owner name are required")
        
        # Check if user already exists
        if check_user_exists(email):
            return ApiResponse(success=False, error="User with this email already exists")
        
        # Create basic profile data
        profile_data = {
            "company_name": company_name,
            "owner_name": owner_name,
            "contact_email": email,
            "industry": "",
            "country": "",
            "employees": 0,
            "annual_revenue_usd": 0,
            "years_in_business": 0,
            "primary_business_activity": "",
            "current_financial_challenges": [],
            "cash_flow_frequency": "",
            "invoice_volume_monthly": 0,
            "expense_categories": [],
            "microfinancing_interest": "",
            "credit_score": "",
            "banking_relationship_bank_name": "",
            "banking_relationship_years": 0,
            "technology_adoption_level": "",
            "technology_adoption_tools": [],
            "financial_goals": [],
            "business_address_street": "",
            "business_address_city": "",
            "business_address_province_or_state": "",
            "business_address_postal_code": "",
            "business_address_country": "",
            "contact_phone": "",
            "preferred_language": "en"
        }
        
        # Create user profile
        user_profile = create_user_profile(profile_data)
        
        return ApiResponse(success=True, data={
            "user_id": user_profile["user_id"],
            "message": "User registered successfully",
            "profile": user_profile
        })
        
    except Exception as e:
        print(f"Error registering user: {str(e)}")
        return ApiResponse(success=False, error=f"Failed to register user: {str(e)}")

@app.post("/auth/login")
async def login_user(request: dict):
    """Authenticate user login"""
    try:
        email = request.get("email", "").strip()
        password = request.get("password", "").strip()
        
        if not email or not password:
            return ApiResponse(success=False, error="Email and password are required")
        
        # Authenticate user
        user_profile = authenticate_user(email, password)
        
        if user_profile:
            return ApiResponse(success=True, data={
                "user_id": user_profile["user_id"],
                "message": "Login successful",
                "profile": user_profile
            })
        else:
            return ApiResponse(success=False, error="Invalid email or password")
        
    except Exception as e:
        print(f"Error logging in user: {str(e)}")
        return ApiResponse(success=False, error=f"Login failed: {str(e)}")

@app.post("/users/{user_id}/profile/complete")
async def complete_user_profile(user_id: int, request: dict):
    """Complete user profile with onboarding data"""
    try:
        # Get the profile data from request
        profile_data = request.get("profile_data", {})
        
        if not profile_data:
            return ApiResponse(success=False, error="Profile data is required")
        
        # Update user profile
        updated_profile = update_user_profile(user_id, profile_data)
        
        return ApiResponse(success=True, data={
            "message": "Profile completed successfully",
            "profile": updated_profile
        })
        
    except Exception as e:
        print(f"Error completing user profile: {str(e)}")
        return ApiResponse(success=False, error=f"Failed to complete profile: {str(e)}")

@app.put("/users/{user_id}/profile")
async def update_user_profile_endpoint(user_id: int, request: dict):
    """Update user profile"""
    try:
        # Get the profile data from request
        profile_data = request.get("profile_data", {})
        
        if not profile_data:
            return ApiResponse(success=False, error="Profile data is required")
        
        # Update user profile
        updated_profile = update_user_profile(user_id, profile_data)
        
        return ApiResponse(success=True, data={
            "message": "Profile updated successfully",
            "profile": updated_profile
        })
        
    except Exception as e:
        print(f"Error updating user profile: {str(e)}")
        return ApiResponse(success=False, error=f"Failed to update profile: {str(e)}")

# Permissions System Endpoints

@app.post("/auth/permissions-login")
async def permissions_login(request: dict):
    """Authenticate user using permissions system"""
    try:
        email = request.get("email", "").strip()
        password = request.get("password", "").strip()
        
        if not email or not password:
            return ApiResponse(success=False, error="Email and password are required")
        
        # Authenticate user using permissions system
        user_data = auth_user(email, password)
        
        if user_data:
            # Get user permissions
            permissions = get_user_permissions(str(user_data["user_id"]))
            
            return ApiResponse(success=True, data={
                "user_id": user_data["user_id"],
                "email": user_data["email"],
                "account_type": user_data["account_type"],
                "company_name": user_data["company_name"],
                "owner_name": user_data["owner_name"],
                "industry": user_data["industry"],
                "country": user_data["country"],
                "permissions": permissions,
                "status": user_data["status"],
                "message": "Login successful"
            })
        else:
            return ApiResponse(success=False, error="Invalid email or password")
        
    except Exception as e:
        print(f"Error in permissions login: {str(e)}")
        return ApiResponse(success=False, error=f"Login failed: {str(e)}")

@app.get("/users/{user_id}/permissions")
async def get_user_permissions_endpoint(user_id: str):
    """Get user permissions"""
    try:
        permissions = get_user_permissions(user_id)
        return ApiResponse(success=True, data={"permissions": permissions})
        
    except Exception as e:
        print(f"Error getting user permissions: {str(e)}")
        return ApiResponse(success=False, error=f"Failed to get permissions: {str(e)}")

@app.post("/users/{user_id}/permissions/check")
async def check_user_permission(user_id: str, request: dict):
    """Check if user has specific permission"""
    try:
        permission = request.get("permission", "").strip()
        
        if not permission:
            return ApiResponse(success=False, error="Permission is required")
        
        has_permission = check_permission(user_id, permission)
        
        return ApiResponse(success=True, data={
            "has_permission": has_permission,
            "permission": permission
        })
        
    except Exception as e:
        print(f"Error checking permission: {str(e)}")
        return ApiResponse(success=False, error=f"Failed to check permission: {str(e)}")

@app.get("/admin/users")
async def get_all_users_endpoint():
    """Get all users (admin only)"""
    try:
        users = get_all_users()
        return ApiResponse(success=True, data={"users": users})
        
    except Exception as e:
        print(f"Error getting all users: {str(e)}")
        return ApiResponse(success=False, error=f"Failed to get users: {str(e)}")

@app.post("/admin/users")
async def create_user_endpoint(request: dict):
    """Create new user account (admin only)"""
    try:
        user_data = request.get("user_data", {})
        
        if not user_data:
            return ApiResponse(success=False, error="User data is required")
        
        success = create_user_account(user_data)
        
        if success:
            return ApiResponse(success=True, data={"message": "User created successfully"})
        else:
            return ApiResponse(success=False, error="Failed to create user (email may already exist)")
        
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        return ApiResponse(success=False, error=f"Failed to create user: {str(e)}")

@app.put("/admin/users/{user_id}/permissions")
async def update_user_permissions_endpoint(user_id: str, request: dict):
    """Update user permissions (admin only)"""
    try:
        permissions = request.get("permissions", [])
        
        if not permissions:
            return ApiResponse(success=False, error="Permissions list is required")
        
        success = update_user_permissions(user_id, permissions)
        
        if success:
            return ApiResponse(success=True, data={"message": "Permissions updated successfully"})
        else:
            return ApiResponse(success=False, error="Failed to update permissions")
        
    except Exception as e:
        print(f"Error updating permissions: {str(e)}")
        return ApiResponse(success=False, error=f"Failed to update permissions: {str(e)}")

@app.get("/admin/users/{user_id}")
async def get_user_by_id_endpoint(user_id: str):
    """Get user by ID (admin only)"""
    try:
        user_data = get_user_by_id(user_id)
        
        if user_data:
            return ApiResponse(success=True, data={"user": user_data})
        else:
            return ApiResponse(success=False, error="User not found")
        
    except Exception as e:
        print(f"Error getting user: {str(e)}")
        return ApiResponse(success=False, error=f"Failed to get user: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)