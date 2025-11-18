-- Service Templates table
CREATE TABLE IF NOT EXISTS service_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    language VARCHAR(100) NOT NULL,
    framework VARCHAR(100),
    icon VARCHAR(50),
    tags TEXT, -- JSON array
    parameters TEXT, -- JSON array
    files TEXT, -- JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Created Services table
CREATE TABLE IF NOT EXISTS created_services (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template VARCHAR(255) NOT NULL,
    repository_url TEXT,
    local_path TEXT,
    parameters TEXT, -- JSON object
    status VARCHAR(50) NOT NULL DEFAULT 'created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    INDEX idx_template (template),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
