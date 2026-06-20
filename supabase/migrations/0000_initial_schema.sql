-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Custom Types (Enums)
create type employee_role as enum ('admin', 'manager', 'accountant', 'creator');
create type document_type as enum ('invoice', 'proforma');
create type invoice_status as enum ('draft', 'sent', 'paid', 'late', 'partially_paid', 'accepted', 'rejected', 'invoiced');
create type line_type as enum ('item', 'section', 'subtotal', 'discount', 'text', 'license', 'support', 'service');
create type payment_method as enum ('transfer', 'card', 'cash', 'mobile');

-- 2. Tables

-- Profiles (Linked to Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role employee_role default 'creator'::employee_role not null,
  avatar text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Settings (Single row for the company configuration)
create table settings (
  id uuid default uuid_generate_v4() primary key,
  company_name text not null,
  ninea text,
  rccm text,
  address text,
  default_tva numeric default 18.0 not null,
  currency text default 'XOF' not null,
  footer_mentions text,
  custom_word_template_invoice text,
  custom_word_template_proforma text,
  auto_reminder boolean default true not null,
  late_alert boolean default false not null,
  monthly_report boolean default true not null,
  enable_workflows boolean default false not null,
  theme_color text default '#2D8B6F' not null,
  logo text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Clients
create table clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text,
  phone text,
  address text,
  ninea text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Invoices
create table invoices (
  id uuid default uuid_generate_v4() primary key,
  number text,
  type document_type default 'invoice'::document_type not null,
  proforma_id uuid references invoices(id) on delete set null,
  client_id uuid references clients(id) on delete restrict not null,
  issue_date date not null,
  due_date date not null,
  status invoice_status default 'draft'::invoice_status not null,
  metadata jsonb default '{}'::jsonb,
  is_locked boolean default false not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Invoice Lines
create table invoice_lines (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references invoices(id) on delete cascade not null,
  type line_type default 'item'::line_type not null,
  description text not null,
  quantity numeric default 1 not null,
  unit_price numeric default 0 not null,
  reference text,
  deliverables text,
  unit text,
  is_forfait boolean default false not null,
  position integer not null, -- To maintain ordering
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Payments
create table payments (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references invoices(id) on delete cascade not null,
  amount numeric not null,
  date date not null,
  method payment_method not null,
  reference text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Row Level Security (RLS) setup
-- For a single-tenant app, we just ensure the user is authenticated.

alter table profiles enable row level security;
alter table settings enable row level security;
alter table clients enable row level security;
alter table invoices enable row level security;
alter table invoice_lines enable row level security;
alter table payments enable row level security;

-- Create basic policies (Allow all authenticated users to do everything inside their company)
create policy "Allow authenticated full access on profiles" on profiles for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access on settings" on settings for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access on clients" on clients for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access on invoices" on invoices for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access on invoice_lines" on invoice_lines for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access on payments" on payments for all using (auth.role() = 'authenticated');

-- 4. Triggers for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger update_settings_modtime before update on settings for each row execute function update_updated_at_column();
create trigger update_clients_modtime before update on clients for each row execute function update_updated_at_column();
create trigger update_invoices_modtime before update on invoices for each row execute function update_updated_at_column();

-- 5. Trigger to create a profile automatically when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'creator'::employee_role);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert initial settings row
insert into settings (company_name, currency, theme_color) values ('IZI Facture Company', 'XOF', '#2D8B6F');
