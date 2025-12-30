-- ============================================
-- Database Role Setup for Bookmarks API
-- ============================================
-- Run this script as the postgres superuser
-- Connect: docker exec -it supabase-db-lowoco8g0ow8okosoooogk4o psql -U postgres

-- 1. Create application role (for runtime operations)
-- Replace 'YOUR_SECURE_PASSWORD' with a generated password from: openssl rand -base64 32
CREATE ROLE bookmarks_app WITH LOGIN PASSWORD 'YOUR_SECURE_PASSWORD';

-- 2. Grant connect permission
GRANT CONNECT ON DATABASE postgres TO bookmarks_app;

-- 3. Grant schema usage
GRANT USAGE ON SCHEMA public TO bookmarks_app;

-- 4. Grant permissions for new tables (created by migrations)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bookmarks_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO bookmarks_app;

-- 5. If tables already exist, grant permissions explicitly
-- Uncomment and run these after migrations have created the tables:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bookmarks_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bookmarks_app;

-- ============================================
-- Verification
-- ============================================
-- Check role exists
SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname = 'bookmarks_app';

-- Check grants (after tables exist)
-- SELECT grantee, table_name, privilege_type
-- FROM information_schema.table_privileges
-- WHERE grantee = 'bookmarks_app';
