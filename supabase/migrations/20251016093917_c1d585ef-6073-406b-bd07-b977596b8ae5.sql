-- Permitir inscripciones públicas en estudiantes_cursos
CREATE POLICY "Permitir inscripción pública de estudiantes"
ON estudiantes_cursos
FOR INSERT
TO anon, authenticated
WITH CHECK (true);