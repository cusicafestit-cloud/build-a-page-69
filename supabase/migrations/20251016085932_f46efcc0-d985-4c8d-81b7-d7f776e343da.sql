-- Create payment methods table
CREATE TABLE IF NOT EXISTS public.formas_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(50),
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  configuracion JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create course payment methods junction table
CREATE TABLE IF NOT EXISTS public.curso_formas_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  forma_pago_id UUID NOT NULL REFERENCES public.formas_pago(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(curso_id, forma_pago_id)
);

-- Enable RLS
ALTER TABLE public.formas_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curso_formas_pago ENABLE ROW LEVEL SECURITY;

-- Policies for formas_pago
CREATE POLICY "Administradores acceso completo formas_pago"
  ON public.formas_pago
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Usuarios autenticados pueden ver formas_pago"
  ON public.curso_formas_pago
  FOR SELECT
  USING (true);

-- Policies for curso_formas_pago
CREATE POLICY "Administradores acceso completo curso_formas_pago"
  ON public.curso_formas_pago
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Usuarios autenticados pueden ver curso_formas_pago"
  ON public.formas_pago
  FOR SELECT
  USING (activo = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_curso_formas_pago_curso_id ON public.curso_formas_pago(curso_id);
CREATE INDEX IF NOT EXISTS idx_curso_formas_pago_forma_pago_id ON public.curso_formas_pago(forma_pago_id);

-- Insert default payment methods
INSERT INTO public.formas_pago (nombre, descripcion, icono, activo, orden) VALUES
('Tarjeta de Crédito/Débito', 'Pago con tarjeta Visa, Mastercard, American Express', 'CreditCard', true, 1),
('Transferencia Bancaria', 'Transferencia o depósito bancario', 'Building2', true, 2),
('PayPal', 'Pago a través de PayPal', 'Wallet', true, 3),
('Pago Móvil', 'Pago móvil o billetera electrónica', 'Smartphone', true, 4),
('Efectivo', 'Pago en efectivo', 'Banknote', true, 5);