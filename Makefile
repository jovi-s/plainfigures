PYTHON_FILES=src/

install:
	@command -v uv >/dev/null 2>&1 || { echo "uv is not installed. Installing uv..."; curl -LsSf https://astral.sh/uv/0.6.12/install.sh | sh; source $HOME/.local/bin/env; }
	uv sync && npm --prefix frontend install

activate:
	source .venv/bin/activate

dev-finance:
	make dev-api & make dev-frontend

dev-api:
	cd backend && uv run uvicorn api_server:app --reload --port 8080

dev-frontend:
	npm --prefix frontend run dev

format format_diff:
	uv run ruff format $(PYTHON_FILES)
	uv run ruff check --select I --fix $(PYTHON_FILES)

frontend-build:
	npm --prefix frontend run build

docker-dev-build:
	docker build -f Dockerfile.local -t plainfigures .

docker-dev-run:
	docker run -p 8080:8080 -p 5173:5173 plainfigures

# http://localhost:5173 (frontend)
# http://localhost:8080 (API endpoints)

# prod:
# 	docker-compose up

# 1. gcloud auth application-default login
deploy-python-backend:
	gcloud config set project plainfigures
	gcloud run deploy plainfigures --memory 1G --max-instances 1 --source . \
		--region=asia-southeast1 \
		--allow-unauthenticated
