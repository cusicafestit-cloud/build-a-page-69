-- Función para obtener usuarios con sus roles
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
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
    ur.user_id,
    ur.user_id::text as user_email,
    ur.created_at as user_created_at,
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
  FROM user_roles ur
  LEFT JOIN roles r ON ur.role_id = r.id
  GROUP BY ur.user_id, ur.created_at
  ORDER BY ur.created_at DESC;
END;
$$;