# Pan-SEA AI Developer Challenge 2025 FINANCE

## Backend - PlainFigures SME Finance Management

PlainFigures is a comprehensive SME finance management system designed to help small and medium enterprises across Southeast Asia manage their cash flow, automate financial operations, and gain AI-powered insights for better financial decision-making.

### 🏗️ Architecture Overview

The backend is built with a multi-agent, code-does-math approach that separates data extraction from computation:

- **FastAPI REST API** - Modern Python web framework for high-performance APIs
- **CSV-Based Data Storage** - Lightweight MVP data persistence for transactions, invoices, customers, and suppliers
- **LangGraph AI Agent** - Advanced research agent for generating contextual financial recommendations
- **Multi-Currency Support** - Handles SGD, MYR, THB, IDR, PHP with automatic conversion
- **Document Processing** - OCR and AI-powered invoice extraction from images and PDFs

### 🚀 Key Features

#### Core Financial Operations
- **Transaction Management** - Record and categorize income/expense transactions
- **Multi-Currency Cash Flow** - Track cash flow with automatic SGD conversion
- **Customer & Supplier Management** - Maintain business relationship records
- **Invoice Processing** - Extract data from uploaded invoices (image/PDF)
- **Financial Summaries** - Real-time cash flow analysis and categorization

#### AI-Powered Intelligence
- **LangGraph Research Agent** - Multi-step web research for financial insights
- **OpenAI GPT-4o Integration** - Fallback AI recommendations using real financial data
- **Automated Expense Categorization** - Smart classification of business expenses
- **Data-Driven Recommendations** - AP reduction, AR optimization, cash flow forecasting

#### Regional SEA Support
- **Multi-Country** - Cambodia, Indonesia, Laos, Malaysia, Philippines, Singapore, Thailand, Vietnam
- **Currency Conversion** - Real-time conversion between regional currencies
- **Localized Business Profiles** - Industry-specific recommendations per country

### 📁 Project Structure

```
backend/
├── src/
│   ├── agent/                 # LangGraph AI Research Agent
│   │   ├── graph.py          # Main agent workflow
│   │   ├── state.py          # Agent state management
│   │   ├── prompts.py        # Structured prompts for research
│   │   ├── configuration.py   # Agent configuration
│   │   └── tools_and_schemas.py # Agent tools and data schemas
│   ├── tools/
│   │   └── finance_tools.py   # Core financial operations (CSV-backed)
│   └── ai_recommendations.py  # AI recommendation generation
├── database/                  # CSV data storage
│   ├── cashflow.csv          # Transaction records
│   ├── user_sme_profile.csv  # Business profiles
│   ├── customers_template.csv # Customer data
│   ├── suppliers_template.csv # Supplier data
│   └── countries/            # Regional business data
├── api_server.py             # FastAPI REST API server
├── pyproject.toml           # Python dependencies and configuration
└── langgraph.json           # LangGraph agent configuration
```

### 🛠️ Technology Stack

- **Python 3.11+** - Core runtime
- **FastAPI** - REST API framework
- **LangGraph** - AI agent orchestration framework
- **Google Gemini 2.0 Flash** - LLM for research agent
- **OpenAI GPT-4o** - Fallback AI recommendations
- **Pandas** - Data manipulation and analysis
- **PyPDF** - PDF document processing
- **OpenAI Vision** - Image-based invoice extraction
- **UV** - Fast Python package management

### 📊 Data Models

#### Transaction Record
```python
{
    "user_id": "1",
    "date": "2025-01-11", 
    "category": "Sales Revenue",
    "currency": "SGD",
    "amount": 1500.0,
    "direction": "IN",  # IN/OUT
    "counterparty_id": "CUS-0001",
    "counterparty_type": "customer",
    "description": "Sale of office supplies",
    "payment_method": "Bank Transfer"
}
```

#### Business Profile
```python
{
    "user_id": "1",
    "company_name": "Sunrise Trading Co",
    "industry": "Import/Export", 
    "country": "Singapore",
    "employees": 25,
    "annual_revenue_usd": 850000,
    "financial_challenges": [...],
    "technology_adoption_level": "Medium"
}
```

### 🔧 API Endpoints

#### Core Operations
- `POST /transactions` - Record new transaction
- `GET /transactions` - List transactions (filterable by user)
- `GET /cashflow/summary` - Get cash flow analysis
- `GET /customers` - Load customer data
- `GET /suppliers` - Load supplier data

#### Document Processing
- `POST /upload/image` - Process invoice from image
- `POST /upload/pdf` - Process invoice from PDF

#### AI Features
- `GET /ai/openai-recommendations` - Get AI financial recommendations
- `POST /agent/message` - Send message to research agent (disabled in production)

#### User Management
- `GET /users/{user_id}/profile` - Get user business profile

#### Utility
- `POST /functions/call` - Direct function call interface
- `GET /health` - Health check endpoint

### 💰 Multi-Currency Support

Supported currencies with conversion rates to SGD:
- **SGD** (Singapore Dollar) - Base currency (1.0)
- **MYR** (Malaysian Ringgit) - 1 MYR = 0.303 SGD
- **THB** (Thai Baht) - 1 THB = 0.042 SGD  
- **IDR** (Indonesian Rupiah) - 1 IDR = 0.000079 SGD
- **PHP** (Philippine Peso) - 1 PHP = 0.023 SGD

All financial calculations and summaries are normalized to SGD for consistency.

### 🤖 AI Agent Features

#### LangGraph Research Agent
- **Multi-step Web Research** - Iterative research with gap identification
- **Contextual Recommendations** - Industry and region-specific advice
- **Structured Output** - JSON-formatted actionable insights
- **Source Citations** - Grounded recommendations with references

#### Recommendation Categories
1. **AP Reduction** - Accounts payable optimization strategies
2. **AR Acceleration** - Accounts receivable improvement tactics  
3. **Cash Flow Forecasting** - Next-month projections and planning

### 🚦 Quick Start

#### Prerequisites
- Python 3.11+
- UV package manager
- OpenAI API key (for AI features)
- Google Gemini API key (for research agent)

#### Installation
```bash
# Install dependencies
uv sync

# Set environment variables
export OPENAI_API_KEY="your-openai-key"

# Start the server
python api_server.py
```

#### Development Server
```bash
# Run with auto-reload
uvicorn api_server:app --reload --host 0.0.0.0 --port 8080
```

### 🧪 Sample Data

The system includes sample data for testing:
- **User Profile**: Sunrise Trading Co (Singapore-based import/export company)
- **Transactions**: Multi-currency cash flow with realistic business transactions
- **Customers/Suppliers**: Template data for business relationships

### 🔒 Security & Production

- **CORS enabled** for frontend integration
- **Input validation** with Pydantic models
- **Error handling** with proper HTTP status codes
- **Environment variable** configuration for API keys
- **Docker ready** with included Dockerfile

### 📈 Business Logic

#### Cash Flow Analysis
- Automatic currency conversion to SGD
- Category-wise expense breakdown
- Net cash flow calculation
- Lookback period filtering (default 30 days)

#### Expense Categorization
Automatic categorization based on description:
- Office Rent, Staff Salaries, Marketing Expenses
- Equipment Purchase, Utilities, Miscellaneous

#### AI Recommendations
Data-driven recommendations using:
- Historical transaction patterns
- Industry benchmarks  
- Regional business practices
- Cash flow trends and projections

### 🌏 Regional Focus

Built specifically for Southeast Asian SMEs with understanding of:
- Regional business practices
- Currency volatility management
- Cross-border trade challenges
- Local regulatory environments
- Technology adoption patterns

### 🔄 Data Flow

1. **Transaction Input** → CSV storage with validation
2. **Currency Conversion** → Normalized SGD calculations  
3. **AI Analysis** → Context-aware recommendations
4. **Frontend Integration** → REST API responses
5. **Document Processing** → OCR → Structured data extraction

### 📝 Development Notes

- **Code-does-math principle**: All calculations performed by Python code, not LLM
- **Multi-agent design**: Separate agents for research, recommendations, and data processing
- **Clear separation**: Extraction logic separate from business computation
- **MVP approach**: CSV-based storage for rapid prototyping and deployment

This backend provides a solid foundation for SME financial management with room for scaling to more sophisticated database systems and additional AI capabilities as needed.