-- 0003_saas_multi_workspace.sql

-- 1. Create company_users table
create table company_users (
  company_id uuid references companies(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role employee_role default 'creator'::employee_role not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (company_id, user_id)
);
alter table company_users enable row level security;

-- 2. Migrate existing links from profiles to company_users
insert into company_users (company_id, user_id, role)
select company_id, id, role from profiles where company_id is not null
on conflict do nothing;

-- 3. Update helper function for RLS
create or replace function user_belongs_to_company(c_id uuid)
returns boolean as $$
  select exists(select 1 from public.company_users where user_id = auth.uid() and company_id = c_id);
$$ language sql security definer;

-- 4. Remove default company_id from tables (from 0002)
alter table settings alter column company_id drop default;
alter table clients alter column company_id drop default;
alter table invoices alter column company_id drop default;
alter table payments alter column company_id drop default;

-- 5. Drop old policies
drop policy if exists "Company access profiles" on profiles;
drop policy if exists "Company access settings" on settings;
drop policy if exists "Company access clients" on clients;
drop policy if exists "Company access invoices" on invoices;
drop policy if exists "Company access invoice_lines" on invoice_lines;
drop policy if exists "Company access payments" on payments;
drop policy if exists "Company access companies" on companies;

-- 6. Create new multi-workspace RLS Policies
-- Companies: User can see companies they belong to
create policy "Workspace access companies" on companies for all using (
  user_belongs_to_company(id)
);

-- Company Users: User can see other users in their companies
create policy "Workspace access company_users" on company_users for all using (
  user_belongs_to_company(company_id)
);

-- Profiles: User can see their own profile, OR profiles of users in their companies
create policy "Workspace access profiles" on profiles for all using (
  id = auth.uid() OR 
  id in (select user_id from company_users where user_belongs_to_company(company_id))
);

-- For other tables, simply check if the user belongs to the row's company_id
create policy "Workspace access settings" on settings for all using (user_belongs_to_company(company_id));
create policy "Workspace access clients" on clients for all using (user_belongs_to_company(company_id));
create policy "Workspace access invoices" on invoices for all using (user_belongs_to_company(company_id));
create policy "Workspace access invoice_lines" on invoice_lines for all using (
  invoice_id in (select id from invoices where user_belongs_to_company(company_id))
);
create policy "Workspace access payments" on payments for all using (user_belongs_to_company(company_id));

-- 7. Safely drop company_id and role from profiles (role is now in company_users, company_id is tracked via company_users)
-- Wait, role might still be useful as a global role or default role, but company_users.role is the real one.
-- Let's keep profiles.role for backwards compatibility for a bit if we want, but drop company_id to avoid confusion.
alter table profiles drop column company_id;

-- 8. Drop old get_user_company_id function
drop function if exists get_user_company_id();

-- 9. Update handle_new_user trigger
create or replace function public.handle_new_user()
returns trigger as $$
declare
  target_company_id uuid;
  is_new_company boolean := false;
begin
  if new.raw_user_meta_data->>'invite_company_id' is not null then
    target_company_id := (new.raw_user_meta_data->>'invite_company_id')::uuid;
  else
    target_company_id := gen_random_uuid();
    is_new_company := true;
  end if;

  if is_new_company then
    -- Insert into companies
    insert into public.companies (id, name)
    values (target_company_id, coalesce(new.raw_user_meta_data->>'company_name', user_name));

    -- Insert default settings
    insert into public.settings (company_id, company_name, currency, theme_color)
    values (target_company_id, coalesce(new.raw_user_meta_data->>'company_name', user_name), 'XOF', '#2D8B6F');
  end if;

  -- Insert profile
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 
          case when is_new_company then 'admin'::employee_role else 'creator'::employee_role end);

  -- Insert company_users
  insert into public.company_users (company_id, user_id, role)
  values (target_company_id, new.id, case when is_new_company then 'admin'::employee_role else 'creator'::employee_role end);

  return new;
end;
$$ language plpgsql security definer;
