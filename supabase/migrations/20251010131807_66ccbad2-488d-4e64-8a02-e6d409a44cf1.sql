-- Actualizar políticas de canjes para usar email en lugar de ID
DROP POLICY IF EXISTS "Administradores acceso completo canjes" ON canjes;

CREATE POLICY "Administradores acceso completo canjes por email" 
ON canjes 
FOR ALL 
USING (
  is_admin_by_email(auth.jwt()->>'email')
)
WITH CHECK (
  is_admin_by_email(auth.jwt()->>'email')
);