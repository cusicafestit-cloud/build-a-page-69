-- Permitir acceso público a curso_profesores para la landing
CREATE POLICY "Permitir lectura pública de curso_profesores"
ON curso_profesores
FOR SELECT
TO anon, authenticated
USING (true);

-- Asegurar que profesores sea accesible públicamente también
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver profesores" ON profesores;

CREATE POLICY "Permitir lectura pública de profesores activos"
ON profesores
FOR SELECT
TO anon, authenticated
USING (activo = true);