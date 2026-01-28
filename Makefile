.PHONY: install dev build preview test test-watch test-coverage typecheck lint clean tauri-dev tauri-build help

# Default target
help:
	@echo "Available targets:"
	@echo "  install        - Install dependencies"
	@echo "  dev            - Start development server"
	@echo "  build          - Build for production"
	@echo "  preview        - Preview production build"
	@echo "  test           - Run tests"
	@echo "  test-watch     - Run tests in watch mode"
	@echo "  test-coverage  - Run tests with coverage"
	@echo "  typecheck      - Run TypeScript type checking"
	@echo "  lint           - Run ESLint"
	@echo "  tauri-dev      - Start Tauri desktop app in dev mode"
	@echo "  tauri-build    - Build Tauri desktop app"
	@echo "  clean          - Remove build artifacts"

install:
	bun install

dev:
	bun run dev

build:
	bun run build

preview:
	bun run preview

test:
	bun test

test-watch:
	bun test --watch

test-coverage:
	bun test --coverage

typecheck:
	bun run typecheck

lint:
	bun run lint

tauri-dev:
	bun run tauri:dev

tauri-build:
	bun run tauri:build

clean:
	rm -rf dist node_modules/.vite
