-- Eliminar TODAS las políticas existentes en usuarios_sistema
DROP POLICY IF EXISTS "Admins have full access to usuarios_sistema" ON usuarios_sistema;
DROP POLICY IF EXISTS "Users can read own profile" ON usuarios_sistema;
DROP POLICY IF EXISTS "Users can create their own initial profile" ON usuarios_sistema;
DROP POLICY IF EXISTS "Admins can do all on usuarios_sistema" ON usuarios_sistema;

-- Crear política para admins usando solo la función is_admin()
CREATE POLICY "Admins have full access to usuarios_sistema" 
ON usuarios_sistema
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());