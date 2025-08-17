install:
	@command -v uv >/dev/null 2>&1 || { echo "uv is not installed. Installing uv..."; curl -LsSf https://astral.sh/uv/0.6.12/install.sh | sh; source $HOME/.local/bin/env; }
	uv sync && npm --prefix frontend install

dev-finance:
	make dev-api & make dev-frontend

dev-api:
	uv run python backend/api_server.py

dev-frontend:
	npm --prefix frontend run dev

lint:
	uv run codespell
	uv run ruff check . --diff
	uv run ruff format . --check --diff
	uv run mypy .

frontend-build:
	npm --prefix frontend run build

docker-build:
	docker build -t plainfigures .

docker-run:
	docker run -p 8000:8000 -p 5173:5173 plainfigures

# http://localhost:5173 (frontend)
# http://localhost:8000 (API endpoints)

prod:
	docker-compose up

# 1. gcloud auth application-default login
deploy:
	gcloud config set project plainfigures
	gcloud run deploy plainfigures --memory 2G --max-instances 1 --source .
