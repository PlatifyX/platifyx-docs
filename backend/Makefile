.PHONY: help run build test clean docker-build docker-run tidy fmt lint

help:
	@echo "PlatifyX Core - Makefile Commands"
	@echo ""
	@echo "  make run           - Run the application"
	@echo "  make build         - Build the application"
	@echo "  make test          - Run tests"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make docker-build  - Build Docker image"
	@echo "  make docker-run    - Run Docker container"
	@echo "  make tidy          - Tidy Go modules"
	@echo "  make fmt           - Format code"
	@echo "  make lint          - Run linter"

run:
	@echo "Running PlatifyX Core..."
	@go run cmd/api/main.go

build:
	@echo "Building PlatifyX Core..."
	@mkdir -p bin
	@go build -o bin/api cmd/api/main.go
	@echo "Build complete: bin/api"

test:
	@echo "Running tests..."
	@go test -v -race -coverprofile=coverage.txt -covermode=atomic ./...

clean:
	@echo "Cleaning..."
	@rm -rf bin/
	@rm -f coverage.txt
	@echo "Clean complete"

docker-build:
	@echo "Building Docker image..."
	@docker build -t platifyx-core:latest .

docker-run:
	@echo "Running Docker container..."
	@docker run -p 8080:8080 --env-file .env platifyx-core:latest

tidy:
	@echo "Tidying modules..."
	@go mod tidy

fmt:
	@echo "Formatting code..."
	@go fmt ./...

lint:
	@echo "Running linter..."
	@golangci-lint run ./...
