-- 0008_workflows_and_notifications.sql

-- Create workflows table
create table workflows (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  document_type text not null check (document_type in ('invoice', 'proforma', 'both')),
  steps jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table workflows enable row level security;
create policy "Workspace access workflows" on workflows for all using (user_belongs_to_company(company_id));

-- Create notifications table
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null check (type in ('info', 'warning', 'success')),
  is_read boolean not null default false,
  target_role text,
  target_roles jsonb,
  target_employee_id uuid,
  target_employee_ids jsonb,
  link text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table notifications enable row level security;
create policy "Workspace access notifications" on notifications for all using (user_belongs_to_company(company_id));

-- Add triggers for updated_at (optional if we want to track modification time)
-- create trigger update_workflows_modtime before update on workflows for each row execute function update_updated_at_column();
-- create trigger update_notifications_modtime before update on notifications for each row execute function update_updated_at_column();
