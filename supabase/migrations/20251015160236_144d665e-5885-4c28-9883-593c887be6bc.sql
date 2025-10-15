-- Eliminar constraint antigua que apunta a auth.users
ALTER TABLE user_roles
DROP CONSTRAINT IF EXISTS user_roles_new_user_id_fkey;

-- Verificar que la constraint correcta existe (user_roles_user_id_fkey)
-- Si no existe, crearla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_fkey'
  ) THEN
    ALTER TABLE user_roles
    ADD CONSTRAINT user_roles_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES usuarios_sistema(id) 
    ON DELETE CASCADE;
  END IF;
END $$;