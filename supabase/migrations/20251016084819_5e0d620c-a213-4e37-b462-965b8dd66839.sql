-- Create junction table for many-to-many relationship between courses and professors
CREATE TABLE IF NOT EXISTS public.curso_profesores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  profesor_id UUID NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(curso_id, profesor_id)
);

-- Enable RLS
ALTER TABLE public.curso_profesores ENABLE ROW LEVEL SECURITY;

-- Create policies for curso_profesores
CREATE POLICY "Administradores acceso completo curso_profesores"
  ON public.curso_profesores
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Usuarios autenticados pueden ver curso_profesores"
  ON public.curso_profesores
  FOR SELECT
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_curso_profesores_curso_id ON public.curso_profesores(curso_id);
CREATE INDEX IF NOT EXISTS idx_curso_profesores_profesor_id ON public.curso_profesores(profesor_id);