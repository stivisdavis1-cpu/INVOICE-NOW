-- 0002_saas_defaults.sql

alter table profiles alter column company_id set default get_user_company_id();
alter table settings alter column company_id set default get_user_company_id();
alter table clients alter column company_id set default get_user_company_id();
alter table invoices alter column company_id set default get_user_company_id();
alter table payments alter column company_id set default get_user_company_id();
