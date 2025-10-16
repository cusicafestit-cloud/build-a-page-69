-- Crear tabla de cuotas para estudiantes
CREATE TABLE IF NOT EXISTS public.cuotas_estudiantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_curso_id UUID NOT NULL REFERENCES public.estudiantes_cursos(id) ON DELETE CASCADE,
  numero_cuota INTEGER NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago TIMESTAMP WITH TIME ZONE,
  estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'vencida', 'cancelada')),
  metodo_pago VARCHAR(100),
  referencia_pago VARCHAR(255),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX idx_cuotas_estudiante_curso ON public.cuotas_estudiantes(estudiante_curso_id);
CREATE INDEX idx_cuotas_estado ON public.cuotas_estudiantes(estado);
CREATE INDEX idx_cuotas_fecha_vencimiento ON public.cuotas_estudiantes(fecha_vencimiento);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_cuotas_estudiantes_updated_at
  BEFORE UPDATE ON public.cuotas_estudiantes
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_updated_at();

-- RLS policies
ALTER TABLE public.cuotas_estudiantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administradores acceso completo cuotas_estudiantes"
  ON public.cuotas_estudiantes
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Usuarios autenticados pueden ver cuotas"
  ON public.cuotas_estudiantes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear cuotas"
  ON public.cuotas_estudiantes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar cuotas"
  ON public.cuotas_estudiantes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);