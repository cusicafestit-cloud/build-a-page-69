-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS "Administradores acceso completo usuarios_sistema" ON usuarios_sistema;

-- Create new policies using the is_admin() function
CREATE POLICY "Admins can do all on usuarios_sistema"
ON usuarios_sistema
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Allow authenticated users to read their own profile
CREATE POLICY "Users can read own profile"
ON usuarios_sistema
FOR SELECT
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));