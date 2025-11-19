-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    squad VARCHAR(100) NOT NULL,
    application VARCHAR(255) NOT NULL,
    language VARCHAR(50),
    version VARCHAR(50),
    repository_type VARCHAR(20),
    repository_url TEXT,
    sonarqube_project VARCHAR(255),
    namespace VARCHAR(100) NOT NULL,
    microservices BOOLEAN DEFAULT true,
    monorepo BOOLEAN DEFAULT false,
    test_unit BOOLEAN DEFAULT false,
    infra VARCHAR(50) DEFAULT 'kube',
    has_stage BOOLEAN DEFAULT true,
    has_prod BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_services_squad ON services(squad);
CREATE INDEX idx_services_name ON services(name);
CREATE INDEX idx_services_namespace ON services(namespace);

-- Add comment
COMMENT ON TABLE services IS 'Catalog of microservices discovered from Kubernetes';
