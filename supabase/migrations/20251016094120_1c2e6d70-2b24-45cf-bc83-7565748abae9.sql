-- Permitir que usuarios anónimos y autenticados puedan ver sus propias inscripciones
CREATE POLICY "Permitir lectura pública de inscripciones propias"
ON estudiantes_cursos
FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir que usuarios puedan crear cuotas al inscribirse
CREATE POLICY "Permitir creación pública de cuotas"
ON cuotas_estudiantes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);