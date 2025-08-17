# Pan-SEA AI Developer Challenge 2025 FINANCE

- https://github.com/google-gemini/gemini-fullstack-langgraph-quickstart

Financial Inclusion:

A lightweight, LLM-driven assistant that helps small business owners track cash flow, generate invoices, manage expenses, ... and explore microfinancing options.

A conversational chatbot powered by SEA-LION that explains fundamental financial concepts (e.g. budgeting, saving, digital payments, interest rates) in local Southeast Asian languages and dialects.

An LLM-related solution that explains loan application criteria (and recommends suitable financial products based on user profile)—all in regional languages.

Financial Trust:

An LLM-related solution that reads and summarizes complex bank or insurance documents into understandable, localized language—clarifying fees, terms, and risks.

(A chatbot that informs users of their rights regarding loans, digital payments, and banking services based on country-specific financial regulations.)

income = money coming in

expenses = money going out

Asset = something that puts money in your pocket

Liability = something that takes money out of your pocket

cash flow = asset -> income

## Overview

The Financial Advisor is a team of specialized AI agents that assists human financial advisors.

1. Cashflow Agent: 

2. Invoice Agent: 

## Setup and Installation

1.  **Prerequisites**

    *   Python 3.11+
    *   uv

        ```bash
        pip install uv
        ```

    * A project on Google Cloud Platform
    * Google Cloud CLI
        *   For installation, please follow the instruction on the official
            [Google Cloud website](https://cloud.google.com/sdk/docs/install).

2.  **Installation**

    ```bash
    # Install the package and dependencies.
    uv install
    ```


## Running the Agent

## Running Tests [NOT IMPLEMENTED]

## Deployment Guide

### Database Configuration

This application uses CSV files stored in the `backend/database/` directory. No additional database credentials are needed.

### Running with Docker

1. Create the `.env` file
2. Run: `docker-compose up --build`
3. The application will be available at `http://localhost:8000`

### Running Locally

1. Create the `.env` file
2. Install dependencies: `uv pip install -e .`
3. Run: `python backend/api_server.py`

This guide covers deploying the backend on Google Cloud and the frontend on Vercel.

### Backend Deployment (Google Cloud)

#### Prerequisites
- Google Cloud account with billing enabled
- `gcloud` CLI installed and configured
- Backend application ready in the `backend/` directory

#### Steps
1. **Build and deploy to Cloud Run** (recommended for FastAPI):
   ```bash
   cd backend
   gcloud run deploy plainfigures-backend \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

2. **Note the deployed URL** (e.g., `https://plainfigures-backend-xxx-uc.a.run.app`)

#### Alternative: Cloud Functions
If deploying as Cloud Functions, update the URL accordingly.

### Frontend Deployment (Vercel)

#### Prerequisites
- Vercel account
- GitHub repository (recommended for automatic deployments)

#### Method 2: Vercel Dashboard (Recommended)
1. **Connect your GitHub repository** to Vercel
2. **Set the project root** to `frontend/`
3. **Configure environment variables**:
   - Go to Project Settings → Environment Variables
   - Add `VITE_BACKEND_URL` with your backend URL
   - Apply to Production (and Preview if needed)

4. **Deploy**:
   - Push to your main branch for automatic deployment
   - Or trigger manual deployment from Vercel dashboard

### Environment Variables Setup

#### Development
Create `/frontend/.env.local`:
```bash
VITE_BACKEND_URL=http://127.0.0.1:8000
```

#### Production (Vercel)
Set in Vercel dashboard:
- **Variable**: `VITE_BACKEND_URL`
- **Value**: Your Google Cloud backend URL
- **Environment**: Production

### Quick Setup Commands

#### For Development:
```bash
# Backend
cd backend
python -m uvicorn api_server:app --reload --host 0.0.0.0 --port 8000

# Frontend (in another terminal)
cd frontend
./setup-dev.sh  # Creates .env.local and installs dependencies
npm run dev
```

#### For Production Build Testing:
```bash
cd frontend
export VITE_BACKEND_URL="https://your-backend-url.com"
npm run build
npm run preview
```

### Verification

After deployment, verify:
1. ✅ Backend health check: `GET https://your-backend-url.com/health`
2. ✅ Frontend loads: Visit your Vercel URL
3. ✅ API calls work: Test transactions, file uploads, etc.

### Troubleshooting

#### CORS Issues
If you encounter CORS errors, ensure your backend includes the frontend domain in allowed origins.

#### Environment Variables Not Loading
- Ensure variables are prefixed with `VITE_`
- Rebuild after changing environment variables
- Check Vercel deployment logs for build-time errors

#### Backend Connection Issues
- Verify the backend URL is accessible
- Check network policies if using VPC
- Ensure the backend is not IP-restricted
