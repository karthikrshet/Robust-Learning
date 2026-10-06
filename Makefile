.PHONY: install test test-coverage run-backend run-frontend run-docker db-migrate clean

install:
	pip install -r requirements.txt
	cd apps/web && npm install

test:
	python -m pytest tests/ -v

test-coverage:
	python -m pytest tests/ --cov=ml --cov=apps/api/app -v

run-backend:
	python -m uvicorn apps.api.app.main:app --reload --port 8000

run-frontend:
	cd apps/web && npm run dev

run-docker:
	docker compose up --build

db-migrate:
	python -m alembic upgrade head

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
