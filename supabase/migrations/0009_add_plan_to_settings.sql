-- 0009_add_plan_to_settings.sql

alter table settings add column if not exists plan text default 'gratuit';
alter table settings add column if not exists trial_end_date timestamp with time zone;

create or replace function public.handle_new_user()
returns trigger as $$
declare
  target_company_id uuid;
  is_new_company boolean := false;
  chosen_plan text;
begin
  if new.raw_user_meta_data->>'invite_company_id' is not null then
    target_company_id := (new.raw_user_meta_data->>'invite_company_id')::uuid;
  else
    target_company_id := gen_random_uuid();
    is_new_company := true;
  end if;

  chosen_plan := coalesce(new.raw_user_meta_data->>'selected_plan', 'gratuit');

  if is_new_company then
    -- Insert into companies
    insert into public.companies (id, name)
    values (target_company_id, coalesce(new.raw_user_meta_data->>'company_name', new.email));

    -- Insert default settings
    insert into public.settings (company_id, company_name, currency, theme_color, plan, trial_end_date)
    values (
      target_company_id, 
      coalesce(new.raw_user_meta_data->>'company_name', new.email), 
      'XOF', 
      '#2D8B6F', 
      chosen_plan,
      case when chosen_plan = 'gratuit' then now() + interval '14 days' else null end
    );
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
