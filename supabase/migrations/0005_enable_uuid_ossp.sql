-- 0005_enable_uuid_ossp.sql
-- Enable the uuid-ossp extension to allow uuid_generate_v4() to work properly across all tables
create extension if not exists "uuid-ossp" with schema extensions;
