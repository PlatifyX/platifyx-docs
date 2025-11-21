-- Create SSO settings table
CREATE TABLE IF NOT EXISTS sso_settings (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT false,
    config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on provider for faster lookups
CREATE INDEX IF NOT EXISTS idx_sso_settings_provider ON sso_settings(provider);

-- Create index on enabled for filtering active providers
CREATE INDEX IF NOT EXISTS idx_sso_settings_enabled ON sso_settings(enabled);

-- Add comment to table
COMMENT ON TABLE sso_settings IS 'Stores SSO (Single Sign-On) provider configurations for Google and Microsoft';
COMMENT ON COLUMN sso_settings.provider IS 'SSO provider type: google, microsoft';
COMMENT ON COLUMN sso_settings.enabled IS 'Whether this SSO provider is currently active';
COMMENT ON COLUMN sso_settings.config IS 'Provider-specific configuration stored as JSON';
