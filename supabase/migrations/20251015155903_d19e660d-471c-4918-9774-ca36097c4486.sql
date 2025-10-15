-- Actualizar la función has_role para usar la tabla correcta
DROP FUNCTION IF EXISTS public.has_role(uuid, text);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND r.nombre = _role_name
      AND r.activo = true
  )
$$;