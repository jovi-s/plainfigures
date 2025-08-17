# Python Backend Deployment
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install uv for faster Python package management
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Copy backend code directly into /app
COPY backend/ ./

# Install Python dependencies
RUN uv pip install --system -e .

# Set Python path to include /app
ENV PYTHONPATH=/app

# Expose port 8080
EXPOSE 8080

# Command to run the FastAPI server (will serve both API and frontend)
CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8080"]