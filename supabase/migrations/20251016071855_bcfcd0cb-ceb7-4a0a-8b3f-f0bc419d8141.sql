-- Eliminar políticas antiguas que usan auth.uid() directamente
DROP POLICY IF EXISTS "Admins can do all on usuarios_sistema" ON usuarios_sistema;

-- Crear nueva política para admins que usa is_admin()
CREATE POLICY "Admins have full access to usuarios_sistema" 
ON usuarios_sistema
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
      AND is_admin_by_email(au.email)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
      AND is_admin_by_email(au.email)
  )
);