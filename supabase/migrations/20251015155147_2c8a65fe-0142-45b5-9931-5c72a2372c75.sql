-- Eliminar función anterior
DROP FUNCTION IF EXISTS public.get_users_with_roles();

-- Crear función corregida con CAST explícito
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  user_nombre TEXT,
  user_created_at TIMESTAMPTZ,
  roles JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id as user_id,
    us.email::TEXT as user_email,
    us.nombre::TEXT as user_nombre,
    us.created_at as user_created_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ur.id,
          'role_id', r.id,
          'role_nombre', r.nombre,
          'role_descripcion', r.descripcion
        )
      ) FILTER (WHERE r.id IS NOT NULL),
      '[]'::jsonb
    ) as roles
  FROM usuarios_sistema us
  LEFT JOIN user_roles ur ON ur.user_id = us.id
  LEFT JOIN roles r ON ur.role_id = r.id
  GROUP BY us.id, us.email, us.nombre, us.created_at
  ORDER BY us.created_at DESC;
END;
$$;