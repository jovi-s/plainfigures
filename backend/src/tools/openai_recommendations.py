import os
import openai
from dotenv import load_dotenv
from src.tools.finance_tools import summarize_cashflow
from src.tools.recommendation_visualizer import generate_recommendation_charts
from src.utils.format_model_response import extract_json_from_response
from src.types.request_types import ApiResponse

load_dotenv()


def openai_recommendations(user_profile_df):
    # Get OpenAI API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return ApiResponse(success=False, error="OpenAI API key not configured")
    
    # Load user profile and financial data
    user_data = {}
    try:
        # Use preloaded DataFrame
        if user_profile_df is not None and not user_profile_df.empty:
            user_data = user_profile_df.iloc[0].to_dict()
    except:
        pass
    
    # Load cashflow data using the same function as /cashflow/summary endpoint
    financial_data = {}
    try:
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
    
    # Try to parse as JSON with robust error handling        
    try:
        recommendations_data = extract_json_from_response(recommendations_text)
        
        if recommendations_data:
            print("Successfully parsed OpenAI response as JSON")
            # Validate the structure
            if "recommendations" not in recommendations_data:
                print("Invalid JSON structure: missing 'recommendations' key")
                recommendations_data = None
            elif not isinstance(recommendations_data["recommendations"], list):
                print("Invalid JSON structure: 'recommendations' is not a list")
                recommendations_data = None
        
        if not recommendations_data:
            print(f"Failed to parse OpenAI response as JSON. Raw response: {recommendations_text}")
            # Enhanced fallback using actual financial data
            recommendations_data = {
                "recommendations": [
                    {
                        "title": "Optimize Cash Flow",
                        "description": f"Based on your current financial position (Net: ${net_cashflow:,.2f}), focus on improving cash flow management",
                        "priority": "high",
                        "action_items": [
                            "Review payment terms with customers", 
                            "Implement faster invoicing processes",
                            "Consider offering early payment discounts"
                        ],
                        "data_reasoning": f"Current net cashflow of ${net_cashflow:,.2f} indicates immediate attention needed",
                        "is_fallback": True
                    },
                    {
                        "title": "Expense Management", 
                        "description": f"With ${total_expenses:,.2f} in monthly expenses, identify optimization opportunities",
                        "priority": "high" if net_cashflow < 0 else "medium", 
                        "action_items": [
                            "Audit all recurring subscriptions and services",
                            "Negotiate better rates with suppliers",
                            "Implement cost tracking for better visibility"
                        ],
                        "data_reasoning": f"Total expenses of ${total_expenses:,.2f} need optimization to improve profitability",
                        "is_fallback": True
                    },
                    {
                        "title": "Revenue Growth Strategy",
                        "description": f"Current income of ${total_income:,.2f} needs strategic enhancement",
                        "priority": "medium",
                        "action_items": [
                            "Analyze top revenue sources for scaling opportunities",
                            "Develop new service offerings or products",
                            "Improve customer retention and upselling"
                        ],
                        "data_reasoning": f"Monthly income of ${total_income:,.2f} provides foundation for growth initiatives",
                        "is_fallback": True
                    }
                ]
            }
                
    except Exception as parse_error:
        print(f"Unexpected error in JSON processing: {parse_error}")
        print(f"Raw response: {recommendations_text}")
        # Final fallback with actual data
        recommendations_data = {
            "recommendations": [
                {
                    "title": "Financial Health Check",
                    "description": f"Review your current financial position: ${net_cashflow:,.2f} net cashflow",
                    "priority": "high",
                    "action_items": ["Schedule financial review", "Analyze cash flow patterns"],
                    "data_reasoning": f"Based on current data: Income ${total_income:,.2f}, Expenses ${total_expenses:,.2f}",
                    "is_fallback": True,
                    "error_note": "Generated due to AI response parsing error"
                }
            ]
        }
    
    # Generate simple visualization charts for each recommendation
    try:
        from src.tools.chart_generator import generate_simple_recommendation_charts
        
        recommendations = recommendations_data.get("recommendations", [])
        chart_data = generate_simple_recommendation_charts(recommendations, financial_data, user_data)
        recommendations_data["charts"] = chart_data
    except Exception as chart_error:
        print(f"Chart generation failed: {chart_error}")
        recommendations_data["charts"] = {"error": "Chart generation failed"}
    
    return recommendations_data