-- Update is_admin_by_email function to check user_roles and roles tables
CREATE OR REPLACE FUNCTION public.is_admin_by_email(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_sistema_id UUID;
  has_admin_role BOOLEAN;
BEGIN
  -- Buscar el usuario en usuarios_sistema por email
  SELECT id INTO user_sistema_id 
  FROM usuarios_sistema 
  WHERE email = user_email
    AND estado = 'activo';
  
  IF user_sistema_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar si tiene rol admin en la tabla user_roles
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_sistema_id
      AND r.nombre = 'admin'
      AND r.activo = true
  ) INTO has_admin_role;
  
  RETURN has_admin_role;
END;
$$;