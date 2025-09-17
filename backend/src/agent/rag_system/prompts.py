"""
Prompts for the LangGraph RAG system
"""

# Query Classification Prompt
QUERY_CLASSIFICATION_PROMPT = """
You are a query classifier for a business RAG system. Your task is to classify user queries into one of three categories based on what data sources would be most relevant:

Categories:
1. "financial_data" - For queries about:
   - Cash flow, transactions, payments
   - Invoices, billing, receivables
   - Financial summaries, profit/loss
   - Expense categories, spending patterns
   - Revenue analysis

2. "ai_recommendations" - For queries about:
   - Business recommendations and insights
   - Market research and analysis
   - AI-generated advice
   - Strategic planning suggestions
   - Business intelligence insights

3. "general_qa" - For queries about:
   - Business concepts and definitions
   - Country-specific business information
   - Regulatory and compliance questions
   - General business knowledge
   - How-to guides and procedures

User Query: {query}

Analyze the query and provide:
1. The most appropriate category
2. Confidence level (0.0 to 1.0)
3. Brief reasoning for your choice

Respond in this format:
Category: [category]
Confidence: [confidence]
Reasoning: [brief explanation]
"""

# Financial Data Analysis Prompt
FINANCIAL_ANALYSIS_PROMPT = """
You are a financial analyst AI assistant. Based on the retrieved financial data, provide a comprehensive analysis of the user's query.

User Query: {query}

Retrieved Financial Data:
{retrieved_data}

Instructions:
1. Analyze the financial data relevant to the query
2. Provide specific numbers, trends, and insights
3. Include calculations where appropriate (let the system handle complex math)
4. Highlight key findings and patterns
5. Make actionable recommendations if appropriate

Important: Focus on factual analysis based on the provided data. If calculations are needed, describe what should be calculated rather than doing complex math yourself.

Response:
"""

# AI Recommendations Analysis Prompt
AI_RECOMMENDATIONS_PROMPT = """
You are a business intelligence assistant. Based on the retrieved AI recommendations and market research, help answer the user's query.

User Query: {query}

Retrieved AI Insights:
{retrieved_data}

Instructions:
1. Synthesize insights from the AI recommendations and market research
2. Provide strategic business advice based on the data
3. Highlight key recommendations and their rationale
4. Connect insights to the user's specific question
5. Suggest actionable next steps

Response:
"""

# General Q&A Prompt
GENERAL_QA_PROMPT = """
You are a knowledgeable business consultant. Based on the retrieved documents, provide a comprehensive answer to the user's query.

User Query: {query}

Retrieved Documents:
{retrieved_data}

Instructions:
1. Provide a clear, informative answer based on the retrieved content
2. Include relevant details from the documents
3. Cite specific sources when appropriate
4. If the query is about a specific country, focus on country-specific information
5. Provide practical, actionable advice when possible

Response:
"""

# Final Answer Synthesis Prompt
FINAL_ANSWER_PROMPT = """
You are synthesizing information from multiple data sources to provide a comprehensive answer to the user's query.

User Query: {query}

Tool Results:
{tool_results}

Instructions:
1. Combine insights from all relevant data sources
2. Provide a coherent, well-structured response
3. Include specific data points and sources
4. Highlight the most important findings
5. Ensure the answer directly addresses the user's question
6. Include source references for credibility

Format your response with:
- Clear answer to the query
- Supporting details and evidence
- Source references
- Any relevant recommendations or next steps

Response:
"""
