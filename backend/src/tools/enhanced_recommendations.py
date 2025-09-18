"""
Enhanced AI Recommendations with Market Research Integration
Combines market intelligence with financial data for strategic recommendations
"""

import json
import pandas as pd
from openai import OpenAI
from typing import Dict, List, Any, Optional
from datetime import datetime
import os
from src.tools.finance_tools import summarize_cashflow
from src.tools.openai_recommendations import openai_recommendations
from src.tools.recommendation_visualizer import generate_recommendation_charts
from src.utils.format_model_response import extract_json_from_response
from src.types.request_types import ApiResponse

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

async def generate_enhanced_recommendations(
    cashflow_df: pd.DataFrame, 
    user_profile_df: pd.DataFrame,
    market_research_data: str,
    existing_ai_recommendations: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate enhanced AI recommendations by combining existing AI recommendations with market research insights
    
    Args:
        cashflow_df: Financial transaction data
        user_profile_df: User business profile
        market_research_data: Market research insights from LangGraph agent
        existing_ai_recommendations: Previously generated AI recommendations from financial data
    
    Returns:
        Dict containing enhanced recommendations with market context
    """
    
    # Get financial summary
    financial_data = summarize_cashflow(cashflow_df)
    user_profile = user_profile_df.iloc[0].to_dict() if not user_profile_df.empty else {}
    
    # Generate existing AI recommendations first (if not provided)
    if existing_ai_recommendations is None:
        print("Generating base AI recommendations from financial data...")
        ai_recs_data = openai_recommendations(user_profile_df)
        existing_ai_recommendations = ai_recs_data.get("recommendations", []) if ai_recs_data else []
        print(f"Generated {len(existing_ai_recommendations)} base recommendations")
    else:
        print(f"Using provided {len(existing_ai_recommendations)} existing recommendations")
    
    # Create enhanced prompt that combines all data sources
    enhanced_prompt = f"""
You are a strategic business advisor with expertise in Southeast Asian markets. 
You have been provided with existing AI recommendations based on financial data, and now need to ENHANCE and EXPAND them using market research intelligence.

=== EXISTING AI RECOMMENDATIONS (Generated from Financial Data) ===
{json.dumps(existing_ai_recommendations, indent=2)}

=== BUSINESS FINANCIAL DATA ===
{json.dumps(financial_data, indent=2)}

=== USER BUSINESS PROFILE ===
- Industry: {user_profile.get('industry', 'N/A')}
- Location: {user_profile.get('location', 'N/A')}
- Company Size: {user_profile.get('company_size', 'N/A')}
- Revenue Target: ${user_profile.get('revenue_target', 'N/A')}
- Key Challenges: {user_profile.get('key_challenges', 'N/A')}
- Goals: {user_profile.get('goals', 'N/A')}

=== MARKET RESEARCH INTELLIGENCE ===
{market_research_data}

=== TASK ===
Your job is to ENHANCE and EXPAND the existing AI recommendations by incorporating market research intelligence. 

**CRITICAL INSTRUCTIONS:**
1. **BUILD UPON existing recommendations**: Take each existing recommendation and enhance it with market context
2. **ADD new market-driven recommendations**: Identify 2-3 additional strategic opportunities from market research
3. **REFERENCE SPECIFIC MARKET DATA**: Use concrete market insights, trends, and competitive intelligence
4. **MAINTAIN FINANCIAL GROUNDING**: Keep the financial data context from existing recommendations
5. **SHOW CLEAR LINKAGES**: Explicitly reference the original AI recommendation numbers, insights, and actions

For each enhanced recommendation, you MUST:
- **Reference the original recommendation**: "Building upon AI Recommendation #1 (Address Immediate Cashflow Issue)..."
- **Quote specific financial data**: Reference the exact numbers from existing recommendations ($2,005.25 net cashflow, $3,236.67 expenses, etc.)
- **Expand original action items**: Take existing action items and enhance them with market intelligence
- **Connect market data to financial insights**: Show how market trends support/expand the financial analysis
- **Maintain traceability**: Make it clear which parts come from financial analysis vs market research

For each recommendation, consider:
- Market size and growth trends from research
- Competitive landscape insights
- Current financial performance vs market benchmarks
- Regulatory and economic factors
- Customer behavior and preferences
- Technology and innovation trends

IMPORTANT: 
- Reference specific market data points and financial metrics
- Prioritize recommendations by potential ROI and market opportunity
- Include both short-term (3-6 months) and long-term (1-2 years) strategies
- Provide quantitative targets where possible

Return your analysis in this JSON format:
{{
  "executive_summary": "Brief overview of key findings and strategic direction",
  "market_context": {{
    "key_opportunities": ["list of market opportunities identified"],
    "main_threats": ["list of market threats to address"],
    "competitive_position": "assessment of current market position"
  }},
  "enhanced_recommendations": [
    {{
      "title": "Strategic recommendation title",
      "description": "Detailed description incorporating both financial and market insights",
      "priority": "high|medium|low",
      "original_recommendation_reference": "Building upon AI Recommendation #X: [Original Title]",
      "financial_foundation": "Quote specific numbers and insights from the original AI recommendation",
      "market_enhancement": "How market research expands and supports the original financial analysis",
      "market_rationale": "Specific market research insights supporting this recommendation",
      "financial_impact": "Expected financial outcomes and metrics",
      "enhanced_action_items": [
        {{
          "original_action": "Original action item from AI recommendation",
          "market_enhancement": "How market intelligence enhances this action",
          "enhanced_action": "Specific enhanced actionable step (timeline: X months)"
        }}
      ],
      "success_metrics": ["measurable outcomes to track"],
      "investment_required": "estimated investment or resources needed",
      "roi_timeline": "expected timeline for return on investment",
      "data_traceability": {{
        "financial_data_source": "Original AI recommendation insights",
        "market_data_source": "Market research intelligence"
      }}
    }}
  ],
  "implementation_roadmap": {{
    "phase_1_immediate": ["actions for next 30 days"],
    "phase_2_short_term": ["actions for next 3-6 months"], 
    "phase_3_long_term": ["actions for next 12+ months"]
  }},
  "risk_mitigation": [
    {{
      "risk": "identified risk factor",
      "mitigation_strategy": "how to address this risk",
      "monitoring_approach": "how to track and measure this risk"
    }}
  ]
}}

Ensure all recommendations are:
- Specific to the Southeast Asian market context
- Backed by both financial data and market research
- Actionable with clear next steps
- Measurable with defined success metrics
- Realistic given the company's current financial position
"""

    try:
        print(f"Generating enhanced recommendations with market intelligence...")
        
        # Call OpenAI API with enhanced prompt
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a strategic business advisor specializing in Southeast Asian markets with expertise in financial analysis and market intelligence."
                },
                {"role": "user", "content": enhanced_prompt}
            ],
            temperature=0.7,
            max_tokens=4000
        )
        
        # Extract and parse the response
        content = response.choices[0].message.content
        print(f"OpenAI API response received: {len(content)} characters")
        
        # Try to extract JSON from the response
        recommendations_data = extract_json_from_response(content)
        
        if not recommendations_data:
            print("Failed to parse JSON, using fallback structure")
            # Fallback structure
            recommendations_data = {
                "executive_summary": "Enhanced strategic analysis combining financial performance with market intelligence.",
                "market_context": {
                    "key_opportunities": ["Market expansion opportunities", "Digital transformation potential"],
                    "main_threats": ["Competitive pressure", "Economic volatility"],
                    "competitive_position": "Analyzing market position based on available data"
                },
                "enhanced_recommendations": [
                    {
                        "title": "Market-Driven Revenue Optimization",
                        "description": "Leverage market insights to optimize revenue streams and capitalize on identified opportunities.",
                        "priority": "high",
                        "market_rationale": "Based on market research findings and competitive analysis",
                        "financial_impact": "Potential 15-25% revenue increase within 12 months",
                        "action_items": [
                            "Analyze top revenue opportunities from market research (30 days)",
                            "Implement targeted marketing campaigns (60 days)",
                            "Optimize pricing strategy based on market positioning (90 days)"
                        ],
                        "success_metrics": ["Revenue growth rate", "Market share increase", "Customer acquisition cost"],
                        "investment_required": "Medium - marketing and operational investments",
                        "roi_timeline": "6-12 months"
                    }
                ],
                "implementation_roadmap": {
                    "phase_1_immediate": ["Conduct detailed market opportunity analysis"],
                    "phase_2_short_term": ["Implement priority market-driven initiatives"],
                    "phase_3_long_term": ["Scale successful strategies and expand market presence"]
                },
                "risk_mitigation": [
                    {
                        "risk": "Market volatility affecting implementation",
                        "mitigation_strategy": "Maintain flexible strategy with regular market monitoring",
                        "monitoring_approach": "Monthly market trend analysis and performance reviews"
                    }
                ],
                "is_fallback": True
            }
        
        # Validate the structure
        if not isinstance(recommendations_data.get("enhanced_recommendations"), list):
            recommendations_data["enhanced_recommendations"] = []
            
        print(f"Enhanced recommendations generated: {len(recommendations_data.get('enhanced_recommendations', []))} items")
        
        # Add metadata
        recommendations_data["generated_at"] = datetime.now().isoformat()
        recommendations_data["data_sources"] = ["financial_transactions", "user_profile", "existing_ai_recommendations", "market_research"]
        recommendations_data["integration_type"] = "market_intelligence_enhanced"
        recommendations_data["base_recommendations_count"] = len(existing_ai_recommendations)
        
        # Generate visualization charts for enhanced recommendations
        try:
            if recommendations_data.get("enhanced_recommendations"):
                # Convert enhanced recommendations to standard format for visualization
                standard_recs = []
                for rec in recommendations_data["enhanced_recommendations"]:
                    standard_recs.append({
                        "title": rec.get("title", ""),
                        "description": rec.get("description", ""),
                        "priority": rec.get("priority", "medium"),
                        "action_items": rec.get("action_items", [])
                    })
                
                chart_data = generate_recommendation_charts(standard_recs, financial_data)
                recommendations_data["visualizations"] = chart_data
        except Exception as viz_error:
            print(f"Error generating enhanced recommendation charts: {viz_error}")
            recommendations_data["visualizations"] = {"error": str(viz_error)}
        
        return recommendations_data
        
    except Exception as e:
        print(f"Error in enhanced recommendations generation: {str(e)}")
        return {
            "error": f"Failed to generate enhanced recommendations: {str(e)}",
            "executive_summary": "Unable to generate enhanced analysis due to technical error.",
            "enhanced_recommendations": [],
            "generated_at": datetime.now().isoformat(),
            "is_fallback": True
        }
