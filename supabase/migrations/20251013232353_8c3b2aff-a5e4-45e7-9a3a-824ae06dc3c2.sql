-- Eliminar policy existente
DROP POLICY IF EXISTS "Administradores acceso completo usuarios_sistema" ON usuarios_sistema;

-- Crear nueva policy usando email en lugar de id
CREATE POLICY "Administradores acceso completo usuarios_sistema"
ON usuarios_sistema
FOR ALL
TO authenticated
USING (
  is_admin_by_email(auth.jwt() ->> 'email')
)
WITH CHECK (
  is_admin_by_email(auth.jwt() ->> 'email')
);