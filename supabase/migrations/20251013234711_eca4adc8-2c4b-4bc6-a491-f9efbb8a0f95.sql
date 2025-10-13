-- Crear bucket para logos de la empresa
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para el bucket de logos
CREATE POLICY "Usuarios autenticados pueden ver logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'logos');

CREATE POLICY "Usuarios autenticados pueden subir logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Usuarios autenticados pueden actualizar logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos');

CREATE POLICY "Usuarios autenticados pueden eliminar logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos');