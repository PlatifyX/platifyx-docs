-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on type for faster queries
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);

-- Create index on enabled for faster queries
CREATE INDEX IF NOT EXISTS idx_integrations_enabled ON integrations(enabled);

-- Insert default integrations (disabled by default)
INSERT INTO integrations (name, type, enabled, config)
VALUES
    ('Azure DevOps', 'azuredevops', false, '{}'::jsonb)
ON CONFLICT (name) DO NOTHING;
