-- 0007_company_users_status.sql

-- 1. Add status column to company_users
ALTER TABLE public.company_users 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' NOT NULL;

-- Make sure we only allow specific statuses
ALTER TABLE public.company_users 
DROP CONSTRAINT IF EXISTS company_users_status_check;

ALTER TABLE public.company_users 
ADD CONSTRAINT company_users_status_check CHECK (status IN ('active', 'pending', 'rejected'));

-- 2. Update user_belongs_to_company to only allow active users
CREATE OR REPLACE FUNCTION user_belongs_to_company(c_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.company_users 
    WHERE user_id = auth.uid() 
      AND company_id = c_id 
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Update the handle_new_user trigger to match existing company name (case-insensitive)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  target_company_id uuid;
  is_new_company boolean := false;
  requested_company_name text;
  existing_company_id uuid;
BEGIN
  -- Get the requested company name from signup metadata
  requested_company_name := new.raw_user_meta_data->>'company_name';
  
  IF new.raw_user_meta_data->>'invite_company_id' IS NOT NULL THEN
    target_company_id := (new.raw_user_meta_data->>'invite_company_id')::uuid;
  ELSIF requested_company_name IS NOT NULL THEN
    -- Try to find an existing company with the exact same name (case-insensitive)
    SELECT id INTO existing_company_id 
    FROM public.companies 
    WHERE lower(name) = lower(trim(requested_company_name)) 
    LIMIT 1;

    IF existing_company_id IS NOT NULL THEN
      -- Company exists, user will join as pending
      target_company_id := existing_company_id;
    ELSE
      -- Company does not exist, create new one
      target_company_id := gen_random_uuid();
      is_new_company := true;
    END IF;
  ELSE
    -- Fallback if no company name is provided
    target_company_id := gen_random_uuid();
    is_new_company := true;
    requested_company_name := 'Nouvelle Entreprise';
  END IF;

  IF is_new_company THEN
    -- Insert into companies
    INSERT INTO public.companies (id, name)
    VALUES (target_company_id, coalesce(requested_company_name, 'Nouvelle Entreprise'));

    -- Insert default settings
    INSERT INTO public.settings (company_id, company_name, currency, theme_color)
    VALUES (target_company_id, coalesce(requested_company_name, 'Nouvelle Entreprise'), 'XOF', '#2D8B6F');
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (id, name, role)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 
          CASE WHEN is_new_company THEN 'admin'::public.employee_role ELSE 'creator'::public.employee_role END);

  -- Insert company_users
  INSERT INTO public.company_users (company_id, user_id, role, status)
  VALUES (
    target_company_id, 
    new.id, 
    CASE WHEN is_new_company THEN 'admin'::public.employee_role ELSE 'creator'::public.employee_role END,
    CASE WHEN is_new_company THEN 'active' ELSE 'pending' END
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
