-- Migration: Password Reset Tokens
-- Cria tabela para armazenar tokens de reset de senha

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    used_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Remover tokens expirados automaticamente (pode ser executado por um job)
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens
    WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE password_reset_tokens IS 'Tokens para reset de senha de usuários';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token único para reset de senha';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Data de expiração do token (geralmente 1 hora)';
COMMENT ON COLUMN password_reset_tokens.used IS 'Indica se o token já foi utilizado';
