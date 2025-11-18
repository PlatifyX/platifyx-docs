# Architecture

## Overview

PlatifyX follows a microservices architecture with the following components:

- **Frontend**: React-based UI
- **Backend**: Go API server
- **Database**: PostgreSQL
- **Integrations**: Multiple cloud providers and tools

## Components

### Backend Services

The backend is organized into layers:

1. **Handler Layer**: HTTP handlers
2. **Service Layer**: Business logic
3. **Repository Layer**: Data access
4. **Domain Layer**: Domain models

### Integrations

Supported integrations:
- Azure DevOps
- GitHub
- Kubernetes
- Grafana
- SonarQube
- AWS, Azure, GCP
