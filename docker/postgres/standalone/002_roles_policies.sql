-- ARYCAR - políticas de acesso para banco separado
-- Execute após 001_schema.sql.

-- 1) Perfis de acesso (NOLOGIN: não expõem senha direta)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'arycar_owner') THEN
    CREATE ROLE arycar_owner NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'arycar_app_rw') THEN
    CREATE ROLE arycar_app_rw NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'arycar_app_ro') THEN
    CREATE ROLE arycar_app_ro NOLOGIN;
  END IF;
END
$$;

-- 2) Usuários de login (altere as senhas em produção)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'arycar_runtime') THEN
    CREATE USER arycar_runtime WITH PASSWORD 'CHANGE_ME_RUNTIME_PASSWORD';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'arycar_readonly') THEN
    CREATE USER arycar_readonly WITH PASSWORD 'CHANGE_ME_READONLY_PASSWORD';
  END IF;
END
$$;

GRANT arycar_app_rw TO arycar_runtime;
GRANT arycar_app_ro TO arycar_readonly;

-- 3) Privilégios de schema e objetos já existentes
GRANT USAGE ON SCHEMA public TO arycar_app_rw, arycar_app_ro;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO arycar_app_rw;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO arycar_app_ro;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO arycar_app_rw;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO arycar_app_ro;

-- 4) Default privileges para futuras migrations
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO arycar_app_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO arycar_app_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO arycar_app_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON SEQUENCES TO arycar_app_ro;

-- 5) Hardening mínimo
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE postgres FROM PUBLIC;

-- 6) RLS opcional (para migração futura multi-tenant)
-- Se quiser ativar, adicione organization_id nas tabelas e descomente blocos abaixo.
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY customers_by_org
--   ON customers
--   FOR ALL
--   USING (organization_id = current_setting('app.current_org_id')::uuid)
--   WITH CHECK (organization_id = current_setting('app.current_org_id')::uuid);
