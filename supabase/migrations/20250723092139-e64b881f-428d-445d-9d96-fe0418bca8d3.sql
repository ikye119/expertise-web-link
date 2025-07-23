-- Fix security warnings by setting proper search_path
CREATE OR REPLACE FUNCTION public.has_role(check_user_id uuid, check_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id
      AND role = check_role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;