#!/bin/bash

echo "Starting plainfigures backend..."
cd /Users/kami/projects/plainfigures

# Kill any existing processes on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Start the backend
uv run python backend/api_server.py

echo "Backend started on http://localhost:8000"
