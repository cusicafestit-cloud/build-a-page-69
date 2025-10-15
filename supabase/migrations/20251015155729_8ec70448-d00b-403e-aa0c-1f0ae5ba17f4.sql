-- Agregar foreign keys a user_roles para vincular con usuarios_sistema y roles

-- Primero, limpiar cualquier dato inconsistente (user_ids que no existen en usuarios_sistema)
DELETE FROM user_roles 
WHERE user_id NOT IN (SELECT id FROM usuarios_sistema);

-- Agregar foreign key a usuarios_sistema
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES usuarios_sistema(id) 
ON DELETE CASCADE;

-- Agregar foreign key a roles
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_role_id_fkey 
FOREIGN KEY (role_id) 
REFERENCES roles(id) 
ON DELETE CASCADE;

-- Agregar foreign key para asignado_por (opcional)
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_asignado_por_fkey 
FOREIGN KEY (asignado_por) 
REFERENCES usuarios_sistema(id) 
ON DELETE SET NULL;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);