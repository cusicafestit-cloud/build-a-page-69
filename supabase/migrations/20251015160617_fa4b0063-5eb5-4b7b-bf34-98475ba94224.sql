-- Verificar y eliminar TODAS las foreign keys antiguas de user_roles
ALTER TABLE user_roles
DROP CONSTRAINT IF EXISTS user_roles_asignado_por_fkey;

-- Permitir asignado_por nulo para evitar problemas
ALTER TABLE user_roles
ALTER COLUMN asignado_por DROP NOT NULL;

-- No necesitamos foreign key para asignado_por por ahora
-- Esto evitará conflictos con auth.users vs usuarios_sistema