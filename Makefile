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
	docker run -p 8000:8000 plainfigures
