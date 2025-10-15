-- Eliminar políticas existentes de user_roles
DROP POLICY IF EXISTS "Admins pueden gestionar asignaciones de roles" ON user_roles;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios roles" ON user_roles;

-- Crear nuevas políticas más permisivas para user_roles
CREATE POLICY "Admins pueden gestionar todas las asignaciones de roles"
ON user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.nombre = 'admin'
      AND r.activo = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.nombre = 'admin'
      AND r.activo = true
  )
);

-- Política para que usuarios vean sus propios roles
CREATE POLICY "Usuarios pueden ver sus propios roles"
ON user_roles
FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.nombre = 'admin'
      AND r.activo = true
  )
);