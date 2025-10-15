-- Eliminar constraint antigua de asignado_por que apunta a auth.users
ALTER TABLE user_roles
DROP CONSTRAINT IF EXISTS user_roles_new_asignado_por_fkey;

-- Recrear constraint correcta
ALTER TABLE user_roles
DROP CONSTRAINT IF EXISTS user_roles_asignado_por_fkey;

ALTER TABLE user_roles
ADD CONSTRAINT user_roles_asignado_por_fkey 
FOREIGN KEY (asignado_por) 
REFERENCES usuarios_sistema(id) 
ON DELETE SET NULL;