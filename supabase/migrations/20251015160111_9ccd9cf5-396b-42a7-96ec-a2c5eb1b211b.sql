-- Simplificar las políticas RLS para user_roles
-- Eliminar políticas recursivas problemáticas
DROP POLICY IF EXISTS "Admins pueden gestionar todas las asignaciones de roles" ON user_roles;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios roles" ON user_roles;

-- Crear función para verificar si un usuario del sistema tiene rol admin
CREATE OR REPLACE FUNCTION public.is_sistema_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  user_sistema_id UUID;
  has_admin_role BOOLEAN;
BEGIN
  -- Obtener el email del usuario autenticado
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Buscar el usuario en usuarios_sistema por email
  SELECT id INTO user_sistema_id FROM usuarios_sistema WHERE email = user_email;
  
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

-- Políticas simples usando la función
CREATE POLICY "Admins del sistema pueden gestionar roles"
ON user_roles
FOR ALL
USING (public.is_sistema_admin())
WITH CHECK (public.is_sistema_admin());

-- Política para que todos los usuarios autenticados puedan ver roles
CREATE POLICY "Usuarios autenticados pueden ver roles"
ON user_roles
FOR SELECT
USING (auth.role() = 'authenticated');