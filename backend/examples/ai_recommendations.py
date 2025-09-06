"""
AI Recommendations Generator using LangGraph Agent

This module integrates the LangGraph research agent with financial data
to generate personalized recommendations for AP reduction, AR increase,
and cashflow projections.
"""

import os
import json
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from langchain_core.messages import HumanMessage

# Import the LangGraph agent
from ..src.agent.graph import graph

# Import currency conversion utilities
from ..src.tools.finance_tools import CURRENCY_RATES, _convert_to_sgd


async def generate_financial_recommendations(user_id: str = "1") -> Dict[str, Any]:
    """
    Generate AI-powered financial recommendations using LangGraph agent
    
    Args:
        user_id: The user ID to generate recommendations for
        
    Returns:
        Dictionary containing recommendations, context summary, and metadata
    """
    try:
        # Step 1: Gather financial context
        context = await gather_financial_context(user_id)
        
        # Step 2: Generate recommendations using LangGraph agent
        recommendations = await generate_recommendations_with_agent(context)
        
        # Step 3: Format and return results
        return {
            "recommendations": recommendations,
            "generated_at": datetime.now().isoformat(),
            "context_summary": context["summary"],
            "user_id": user_id
        }
        
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        return {
            "recommendations": get_fallback_recommendations(),
            "generated_at": datetime.now().isoformat(),
            "context_summary": "Unable to analyze current data - showing general recommendations",
            "user_id": user_id,
            "error": str(e)
        }


async def gather_financial_context(user_id: str) -> Dict[str, Any]:
    """Gather financial context from user profile and transaction data"""
    
    base_path = Path(__file__).parent.parent / "database"
    
    # Load user profile
    profile_path = base_path / "user_sme_profile.csv"
    user_profile = {}
    if profile_path.exists():
        df = pd.read_csv(profile_path)
        user_row = df[df['user_id'].astype(str) == str(user_id)]
        if not user_row.empty:
            user_profile = user_row.iloc[0].to_dict()
    
    # Load cashflow data
    cashflow_path = base_path / "cashflow.csv"
    transactions = []
    cashflow_summary = {}
    if cashflow_path.exists():
        df = pd.read_csv(cashflow_path)
        # Filter for the user and recent transactions (last 90 days)
        recent_date = datetime.now() - timedelta(days=90)
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        user_transactions = df[df['user_id'].astype(str) == str(user_id)]
        recent_transactions = user_transactions[user_transactions['date'] >= recent_date]
        
        transactions = recent_transactions.to_dict('records')
        
        # Calculate cashflow summary (convert all currencies to SGD)
        income_sgd = 0.0
        expenses_sgd = 0.0
        expense_by_category = {}
        
        for _, transaction in recent_transactions.iterrows():
            amount = transaction.get('amount', 0)
            currency = transaction.get('currency', 'SGD') or 'SGD'
            direction = transaction.get('direction', '')
            category = transaction.get('category', 'Uncategorized') or 'Uncategorized'
            
            # Convert amount to SGD
            amount_sgd = _convert_to_sgd(float(amount), currency)
            
            if direction == 'IN':
                income_sgd += round(amount_sgd, 2)
            elif direction == 'OUT':
                expenses_sgd += round(amount_sgd, 2)
                # Categorize expenses in SGD
                expense_by_category[category] = expense_by_category.get(category, 0) + amount_sgd
        
        net_cashflow = income_sgd - expenses_sgd
        
        cashflow_summary = {
            "total_income": float(income_sgd),
            "total_expenses": float(expenses_sgd),
            "net_cashflow": float(net_cashflow),
            "expense_by_category": expense_by_category,
            "transaction_count": len(recent_transactions),
            "avg_transaction_amount": float(recent_transactions['amount'].mean()) if len(recent_transactions) > 0 else 0
        }
    
    # Create context summary
    company_name = user_profile.get('company_name', 'Your Company')
    industry = user_profile.get('industry', 'General Business')
    country = user_profile.get('country', 'Unknown')
    employees = user_profile.get('employees', 0)
    
    context_summary = f"""
    Company: {company_name} ({industry})
    Location: {country}, Employees: {employees}
    Recent Financial Performance (Last 90 days, all amounts in SGD):
    - Total Income: ${cashflow_summary.get('total_income', 0):,.2f} SGD
    - Total Expenses: ${cashflow_summary.get('total_expenses', 0):,.2f} SGD
    - Net Cashflow: ${cashflow_summary.get('net_cashflow', 0):,.2f} SGD
    - Transaction Volume: {cashflow_summary.get('transaction_count', 0)} transactions
    """
    
    return {
        "user_profile": user_profile,
        "cashflow_summary": cashflow_summary,
        "recent_transactions": transactions,
        "summary": context_summary.strip()
    }


async def generate_recommendations_with_agent(context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Use LangGraph agent to generate intelligent recommendations"""
    
    try:
        # Create research queries for the agent
        user_profile = context["user_profile"]
        cashflow = context["cashflow_summary"]
        
        company_name = user_profile.get('company_name', 'SME Company')
        industry = user_profile.get('industry', 'General Business')
        country = user_profile.get('country', 'Singapore')
        net_cashflow = cashflow.get('net_cashflow', 0)
        
        # Determine the primary challenge
        if net_cashflow < 0:
            primary_focus = "reducing expenses and improving cash flow"
        elif cashflow.get('total_income', 0) < 100000:
            primary_focus = "increasing revenue and accounts receivable"
        else:
            primary_focus = "optimizing cash flow and growth strategies"
        
        # Create a targeted research query
        research_query = f"""
        Best practices for {primary_focus} for a {industry} company in {country} with {user_profile.get('employees', 0)} employees.
        Current situation: 
        - Net cashflow: ${net_cashflow:,.2f}
        - Total income: ${cashflow.get('total_income', 0):,.2f}
        - Total expenses: ${cashflow.get('total_expenses', 0):,.2f}
        
        Focus on actionable strategies for:
        1. Accounts Payable (AP) reduction and payment optimization
        2. Accounts Receivable (AR) improvement and faster collection
        3. Cash flow forecasting and management for next month
        """
        
        # Run the LangGraph agent
        messages = [HumanMessage(content=research_query)]
        
        # Execute the graph
        result = await graph.ainvoke(
            {"messages": messages},
            config={"configurable": {"max_research_loops": 1, "number_of_initial_queries": 2}}
        )
        
        # Extract the final response
        agent_response = ""
        if result and "messages" in result:
            final_message = result["messages"][-1]
            agent_response = final_message.content if hasattr(final_message, 'content') else str(final_message)
        
        # Parse the agent response into structured recommendations
        recommendations = parse_agent_response_to_recommendations(agent_response, context)
        
        return recommendations
        
    except Exception as e:
        print(f"Error with LangGraph agent: {e}")
        return get_context_based_recommendations(context)


def parse_agent_response_to_recommendations(agent_response: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Parse the agent's research response into structured recommendations"""
    
    recommendations = []
    cashflow = context["cashflow_summary"]
    
    # AP Reduction Recommendation
    ap_actions = extract_ap_actions_from_response(agent_response)
    if not ap_actions:
        ap_actions = ["Negotiate longer payment terms with suppliers", "Implement approval workflows for expenses", "Review and cancel unnecessary subscriptions"]
    
    recommendations.append({
        "type": "AP_REDUCTION",
        "title": "Optimize Accounts Payable",
        "description": f"Based on current expenses of ${cashflow.get('total_expenses', 0):,.2f}, here are strategies to reduce costs and improve payment efficiency.",
        "priority": "high" if cashflow.get('net_cashflow', 0) < 0 else "medium",
        "actionItems": ap_actions[:3]  # Limit to top 3
    })
    
    # AR Increase Recommendation  
    ar_actions = extract_ar_actions_from_response(agent_response)
    if not ar_actions:
        ar_actions = ["Implement automated invoice reminders", "Offer early payment discounts", "Review credit terms for customers"]
        
    recommendations.append({
        "type": "AR_INCREASE", 
        "title": "Accelerate Accounts Receivable",
        "description": f"Strategies to improve cash collection and increase revenue from current ${cashflow.get('total_income', 0):,.2f} income level.",
        "priority": "high" if cashflow.get('total_income', 0) < cashflow.get('total_expenses', 0) else "medium",
        "actionItems": ar_actions[:3]
    })
    
    # Cashflow Projection
    projection_actions = extract_projection_actions_from_response(agent_response)
    if not projection_actions:
        projection_actions = ["Create weekly cash flow forecasts", "Set up cash flow alerts", "Build a 3-month cash reserve"]
        
    next_month_projection = estimate_next_month_cashflow(context)
    
    recommendations.append({
        "type": "CASHFLOW_PROJECTION",
        "title": "Next Month Cash Flow Outlook", 
        "description": f"Projected net cash flow for next month: ${next_month_projection:,.2f}. Here's how to improve it.",
        "priority": "high" if next_month_projection < 0 else "low",
        "actionItems": projection_actions[:3]
    })
    
    return recommendations


def extract_ap_actions_from_response(response: str) -> List[str]:
    """Extract AP-related action items from agent response"""
    ap_keywords = ["payable", "payment", "supplier", "vendor", "expense", "cost", "procurement"]
    actions = []
    
    lines = response.split('\n')
    for line in lines:
        if any(keyword in line.lower() for keyword in ap_keywords):
            if any(action_word in line.lower() for action_word in ["negotiate", "review", "implement", "reduce", "optimize"]):
                cleaned = line.strip('- •*').strip()
                if len(cleaned) > 10 and len(cleaned) < 100:
                    actions.append(cleaned)
    
    return actions[:5]  # Limit results


def extract_ar_actions_from_response(response: str) -> List[str]:
    """Extract AR-related action items from agent response"""
    ar_keywords = ["receivable", "collection", "invoice", "customer", "revenue", "sales", "billing"]
    actions = []
    
    lines = response.split('\n')
    for line in lines:
        if any(keyword in line.lower() for keyword in ar_keywords):
            if any(action_word in line.lower() for action_word in ["implement", "improve", "accelerate", "increase", "optimize"]):
                cleaned = line.strip('- •*').strip()
                if len(cleaned) > 10 and len(cleaned) < 100:
                    actions.append(cleaned)
    
    return actions[:5]


def extract_projection_actions_from_response(response: str) -> List[str]:
    """Extract cashflow projection actions from agent response"""
    projection_keywords = ["forecast", "predict", "projection", "cash flow", "planning", "budget"]
    actions = []
    
    lines = response.split('\n')
    for line in lines:
        if any(keyword in line.lower() for keyword in projection_keywords):
            if any(action_word in line.lower() for action_word in ["create", "build", "develop", "establish", "track"]):
                cleaned = line.strip('- •*').strip()
                if len(cleaned) > 10 and len(cleaned) < 100:
                    actions.append(cleaned)
    
    return actions[:5]


def estimate_next_month_cashflow(context: Dict[str, Any]) -> float:
    """Estimate next month's cashflow based on recent trends"""
    cashflow = context["cashflow_summary"]
    
    current_net = cashflow.get("net_cashflow", 0)
    
    # Simple projection: assume similar pattern but with 5% variance
    # In a real implementation, this would use more sophisticated forecasting
    base_projection = current_net * 1.0  # Same as current month
    
    # Adjust based on seasonality or trends (simplified)
    if current_net > 0:
        projected = base_projection * 1.05  # Slight optimism if positive
    else:
        projected = base_projection * 0.95  # More conservative if negative
        
    return projected


def get_context_based_recommendations(context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate basic recommendations based on financial context when agent fails"""
    
    recommendations = []
    cashflow = context["cashflow_summary"]
    profile = context["user_profile"]
    
    net_cashflow = cashflow.get("net_cashflow", 0)
    industry = profile.get("industry", "General Business")
    
    # AP Reduction
    recommendations.append({
        "type": "AP_REDUCTION",
        "title": "Reduce Accounts Payable",
        "description": f"Focus on optimizing expenses from current ${cashflow.get('total_expenses', 0):,.2f}",
        "priority": "high" if net_cashflow < 0 else "medium",
        "actionItems": [
            "Negotiate extended payment terms with key suppliers",
            "Implement expense approval workflows", 
            "Review and eliminate unnecessary recurring costs"
        ]
    })
    
    # AR Increase
    recommendations.append({
        "type": "AR_INCREASE",
        "title": "Increase Accounts Receivable",
        "description": f"Accelerate collections and grow revenue from ${cashflow.get('total_income', 0):,.2f}",
        "priority": "medium",
        "actionItems": [
            "Send automated payment reminders",
            "Offer early payment discounts (2% within 10 days)",
            "Tighten credit terms for new customers"
        ]
    })
    
    # Cashflow Projection
    next_month_est = estimate_next_month_cashflow(context)
    recommendations.append({
        "type": "CASHFLOW_PROJECTION", 
        "title": "Next Month Outlook",
        "description": f"Estimated net cashflow: ${next_month_est:,.2f}",
        "priority": "high" if next_month_est < 0 else "low",
        "actionItems": [
            "Create weekly cash flow forecasts",
            "Set up automated cash flow monitoring",
            "Build emergency cash reserves (3 months expenses)"
        ]
    })
    
    return recommendations


def get_fallback_recommendations() -> List[Dict[str, Any]]:
    """Fallback recommendations when everything fails"""
    return [
        {
            "type": "AP_REDUCTION",
            "title": "Optimize Payment Management",
            "description": "General strategies to improve accounts payable management",
            "priority": "medium",
            "actionItems": [
                "Review all recurring expenses and subscriptions",
                "Negotiate better payment terms with suppliers",
                "Implement expense approval processes"
            ]
        },
        {
            "type": "AR_INCREASE", 
            "title": "Improve Cash Collection",
            "description": "Standard practices to accelerate receivables",
            "priority": "medium",
            "actionItems": [
                "Send invoices immediately upon delivery",
                "Follow up on overdue accounts weekly", 
                "Consider offering early payment incentives"
            ]
        },
        {
            "type": "CASHFLOW_PROJECTION",
            "title": "Cash Flow Planning",
            "description": "Basic cash flow management recommendations",
            "priority": "low",
            "actionItems": [
                "Create monthly cash flow forecasts",
                "Monitor key financial metrics weekly",
                "Maintain emergency cash reserves"
            ]
        }
    ]
