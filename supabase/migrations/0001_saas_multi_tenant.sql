-- 0001_saas_multi_tenant.sql

-- 1. Create companies table
create table companies (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table companies enable row level security;

-- 2. Create Default Company for existing records
insert into companies (id, name) values ('00000000-0000-0000-0000-000000000000', 'Default Company');

-- 3. Add company_id to existing tables
alter table profiles add column company_id uuid references companies(id);
update profiles set company_id = '00000000-0000-0000-0000-000000000000' where company_id is null;
alter table profiles alter column company_id set not null;

alter table settings add column company_id uuid references companies(id);
update settings set company_id = '00000000-0000-0000-0000-000000000000' where company_id is null;
alter table settings alter column company_id set not null;

alter table clients add column company_id uuid references companies(id);
update clients set company_id = '00000000-0000-0000-0000-000000000000' where company_id is null;
alter table clients alter column company_id set not null;

alter table invoices add column company_id uuid references companies(id);
update invoices set company_id = '00000000-0000-0000-0000-000000000000' where company_id is null;
alter table invoices alter column company_id set not null;

alter table payments add column company_id uuid references companies(id);
update payments set company_id = '00000000-0000-0000-0000-000000000000' where company_id is null;
alter table payments alter column company_id set not null;

-- 4. Helper function for RLS
create or replace function get_user_company_id()
returns uuid as $$
  select company_id from public.profiles where id = auth.uid();
$$ language sql security definer;

-- 5. Drop old policies
drop policy if exists "Allow authenticated full access on profiles" on profiles;
drop policy if exists "Allow authenticated full access on settings" on settings;
drop policy if exists "Allow authenticated full access on clients" on clients;
drop policy if exists "Allow authenticated full access on invoices" on invoices;
drop policy if exists "Allow authenticated full access on invoice_lines" on invoice_lines;
drop policy if exists "Allow authenticated full access on payments" on payments;

-- 6. Create SaaS RLS Policies
create policy "Company access profiles" on profiles for all using (company_id = get_user_company_id() OR id = auth.uid());
create policy "Company access settings" on settings for all using (company_id = get_user_company_id());
create policy "Company access clients" on clients for all using (company_id = get_user_company_id());
create policy "Company access invoices" on invoices for all using (company_id = get_user_company_id());
create policy "Company access invoice_lines" on invoice_lines for all using (invoice_id in (select id from invoices where company_id = get_user_company_id()));
create policy "Company access payments" on payments for all using (company_id = get_user_company_id());
create policy "Company access companies" on companies for all using (id = get_user_company_id());

-- 7. Update the handle_new_user trigger to handle companies
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger as $$
declare
  target_company_id uuid;
  is_new_company boolean := false;
begin
  -- Check if user was invited to a specific company
  if new.raw_user_meta_data->>'invite_company_id' is not null then
    target_company_id := (new.raw_user_meta_data->>'invite_company_id')::uuid;
  else
    target_company_id := uuid_generate_v4();
    is_new_company := true;
  end if;

  if is_new_company then
    -- Insert into companies
    insert into public.companies (id, name)
    values (target_company_id, coalesce(new.raw_user_meta_data->>'company_name', 'Nouvelle Entreprise'));

    -- Insert default settings
    insert into public.settings (company_id, company_name, currency, theme_color)
    values (target_company_id, coalesce(new.raw_user_meta_data->>'company_name', 'Nouvelle Entreprise'), 'XOF', '#2D8B6F');
  end if;

  -- Insert profile
  insert into public.profiles (id, name, role, company_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 
          case when is_new_company then 'admin'::employee_role else 'creator'::employee_role end, 
          target_company_id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
