-- Eliminar política restrictiva existente
DROP POLICY IF EXISTS "Administradores acceso completo configuraciones_sistema" ON configuraciones_sistema;

-- Crear políticas más flexibles para configuraciones_sistema
CREATE POLICY "Usuarios autenticados pueden leer configuraciones"
ON configuraciones_sistema
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar configuraciones"
ON configuraciones_sistema
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar configuraciones"
ON configuraciones_sistema
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Solo administradores pueden eliminar configuraciones"
ON configuraciones_sistema
FOR DELETE
TO authenticated
USING (is_admin());

-- Agregar índice único en la columna clave para el upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_configuraciones_clave ON configuraciones_sistema(clave);