-- 0004_fix_handle_new_user.sql
-- Fix the trigger to use gen_random_uuid() instead of uuid_generate_v4() which requires an extension

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
    values (target_company_id, coalesce(new.raw_user_meta_data->>'company_name', 'Nouvelle Entreprise'));

    -- Insert default settings
    insert into public.settings (company_id, company_name, currency, theme_color)
    values (target_company_id, coalesce(new.raw_user_meta_data->>'company_name', 'Nouvelle Entreprise'), 'XOF', '#2D8B6F');
  end if;

  -- Insert profile
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 
          case when is_new_company then 'admin'::public.employee_role else 'creator'::public.employee_role end);

  -- Insert company_users
  insert into public.company_users (company_id, user_id, role)
  values (target_company_id, new.id, case when is_new_company then 'admin'::public.employee_role else 'creator'::public.employee_role end);

  return new;
end;
$$ language plpgsql security definer set search_path = public;
