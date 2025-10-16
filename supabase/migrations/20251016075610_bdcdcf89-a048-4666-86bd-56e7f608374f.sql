-- Drop existing function and recreate with last_sign_in_at
DROP FUNCTION IF EXISTS public.get_users_with_roles();

CREATE FUNCTION public.get_users_with_roles()
RETURNS TABLE(
  user_id uuid, 
  user_email text, 
  user_nombre text, 
  user_created_at timestamp with time zone,
  user_last_sign_in_at timestamp with time zone,
  roles jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id as user_id,
    us.email::TEXT as user_email,
    us.nombre::TEXT as user_nombre,
    us.created_at as user_created_at,
    au.last_sign_in_at as user_last_sign_in_at,
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
  LEFT JOIN auth.users au ON au.email = us.email
  LEFT JOIN user_roles ur ON ur.user_id = us.id
  LEFT JOIN roles r ON ur.role_id = r.id
  GROUP BY us.id, us.email, us.nombre, us.created_at, au.last_sign_in_at
  ORDER BY us.created_at DESC;
END;
$$;