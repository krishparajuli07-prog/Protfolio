.PHONY: dev build preview lint test docker-up docker-down clean headers validate

dev:
	npm ci && npm run dev

build:
	npm ci && npm run build

preview:
	npm run preview

lint:
	npm run lint

test:
	npm test

validate:
	npm run validate

headers:
	npm run headers

docker-up:
	docker compose --profile prod up --build

docker-down:
	docker compose --profile prod down

clean:
	rm -rf dist .astro node_modules
