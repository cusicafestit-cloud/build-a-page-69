-- Crear tabla de profesores
CREATE TABLE IF NOT EXISTS public.profesores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  foto_url TEXT,
  especialidades TEXT[],
  bio TEXT,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_profesores_updated_at
  BEFORE UPDATE ON public.profesores
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_updated_at();

-- RLS policies
ALTER TABLE public.profesores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administradores acceso completo profesores"
  ON public.profesores
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Usuarios autenticados pueden ver profesores"
  ON public.profesores
  FOR SELECT
  TO authenticated
  USING (true);

-- Crear bucket para fotos de profesores
INSERT INTO storage.buckets (id, name, public)
VALUES ('profesores-fotos', 'profesores-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para el bucket de fotos de profesores
CREATE POLICY "Fotos de profesores son públicas"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profesores-fotos');

CREATE POLICY "Usuarios autenticados pueden subir fotos de profesores"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profesores-fotos');

CREATE POLICY "Usuarios autenticados pueden actualizar fotos de profesores"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profesores-fotos');

CREATE POLICY "Administradores pueden eliminar fotos de profesores"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'profesores-fotos' AND is_admin());