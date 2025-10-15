-- Corregir la función is_admin() para que funcione con usuarios_sistema
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
  user_sistema_id UUID;
  has_admin_role BOOLEAN;
BEGIN
  -- Obtener el email del usuario autenticado
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Buscar el usuario en usuarios_sistema por email
  SELECT id INTO user_sistema_id 
  FROM usuarios_sistema 
  WHERE email = user_email;
  
  IF user_sistema_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar si tiene rol admin
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

-- Actualizar también la función has_role para que funcione correctamente
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
  user_sistema_id UUID;
  has_role_result BOOLEAN;
BEGIN
  -- Si se pasa un user_id, usar ese
  -- Si no, obtener del usuario actual autenticado
  IF _user_id IS NOT NULL THEN
    -- Buscar el email del usuario en auth.users
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = _user_id;
  ELSE
    -- Obtener el email del usuario autenticado actual
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = auth.uid();
  END IF;
  
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Buscar el usuario en usuarios_sistema por email
  SELECT id INTO user_sistema_id 
  FROM usuarios_sistema 
  WHERE email = user_email;
  
  IF user_sistema_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar si tiene el rol especificado
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_sistema_id
      AND r.nombre = _role_name
      AND r.activo = true
  ) INTO has_role_result;
  
  RETURN has_role_result;
END;
$$;