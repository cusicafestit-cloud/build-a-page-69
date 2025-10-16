-- Insertar usuario gmontiel@spatiumgroup.com en usuarios_sistema si no existe
INSERT INTO usuarios_sistema (nombre, email, password_hash, rol, estado)
VALUES ('Gabriel Montiel', 'gmontiel@spatiumgroup.com', 'managed_by_supabase_auth', 'admin', 'activo')
ON CONFLICT (email) DO NOTHING;

-- Asignar rol admin al usuario
INSERT INTO user_roles (user_id, role_id)
SELECT 
  us.id,
  r.id
FROM usuarios_sistema us
CROSS JOIN roles r
WHERE us.email = 'gmontiel@spatiumgroup.com'
  AND r.nombre = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = us.id AND ur.role_id = r.id
  );