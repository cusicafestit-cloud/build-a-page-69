-- Agregar columna para la foto del comprobante de pago
ALTER TABLE public.cuotas_estudiantes
ADD COLUMN comprobante_pago_url TEXT;

-- Crear bucket para comprobantes de pago si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes-pago', 'comprobantes-pago', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para el bucket de comprobantes
CREATE POLICY "Usuarios autenticados pueden ver comprobantes"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'comprobantes-pago');

CREATE POLICY "Usuarios autenticados pueden subir comprobantes"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'comprobantes-pago');

CREATE POLICY "Administradores pueden eliminar comprobantes"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'comprobantes-pago' AND is_admin());