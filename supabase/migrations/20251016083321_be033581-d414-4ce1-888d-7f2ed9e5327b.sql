-- Crear bucket para imágenes de cursos si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('cursos-imagenes', 'cursos-imagenes', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para el bucket de imágenes de cursos
CREATE POLICY "Imágenes de cursos son públicas"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'cursos-imagenes');

CREATE POLICY "Usuarios autenticados pueden subir imágenes de cursos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cursos-imagenes');

CREATE POLICY "Usuarios autenticados pueden actualizar imágenes de cursos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'cursos-imagenes');

CREATE POLICY "Administradores pueden eliminar imágenes de cursos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'cursos-imagenes' AND is_admin());