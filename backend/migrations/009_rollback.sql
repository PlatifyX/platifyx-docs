-- Rollback script para limpar o sistema de gerenciamento de usuários
-- Execute este script se precisar limpar as tabelas antes de rodar a migration novamente

-- Dropar tabelas na ordem reversa (por causa das foreign keys)
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS sso_configs CASCADE;
DROP TABLE IF EXISTS user_teams CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Confirmar que as tabelas foram removidas
SELECT 'Todas as tabelas do sistema de gerenciamento de usuários foram removidas' AS status;
