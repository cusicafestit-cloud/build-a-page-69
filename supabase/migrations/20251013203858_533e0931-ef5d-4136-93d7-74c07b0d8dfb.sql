-- Paso 1: Crear la tabla de asistencias (relación muchos-a-muchos)
CREATE TABLE IF NOT EXISTS public.asistencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asistente_id UUID NOT NULL,
  evento_id UUID NOT NULL,
  tipo_ticket_id UUID NOT NULL,
  codigo_ticket VARCHAR,
  estado VARCHAR DEFAULT 'confirmado',
  fecha_compra TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(asistente_id, evento_id, tipo_ticket_id)
);

-- Paso 2: Migrar datos existentes de asistentes a la nueva estructura
-- Primero, eliminar duplicados de email en asistentes (mantener el más reciente)
WITH ranked_asistentes AS (
  SELECT 
    id,
    email,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM asistentes
)
DELETE FROM asistentes
WHERE id IN (
  SELECT id FROM ranked_asistentes WHERE rn > 1
);

-- Paso 3: Insertar las asistencias existentes en la nueva tabla
INSERT INTO asistencias (asistente_id, evento_id, tipo_ticket_id, codigo_ticket, estado, fecha_compra, created_at)
SELECT 
  a.id as asistente_id,
  a.evento_id,
  a.tipo_ticket_id,
  a.codigo_ticket,
  a.estado,
  a.fecha_compra,
  a.created_at
FROM asistentes a
WHERE a.evento_id IS NOT NULL AND a.tipo_ticket_id IS NOT NULL
ON CONFLICT (asistente_id, evento_id, tipo_ticket_id) DO NOTHING;

-- Paso 4: Modificar la tabla asistentes para que no tenga evento_id
ALTER TABLE asistentes DROP COLUMN IF EXISTS evento_id;
ALTER TABLE asistentes DROP COLUMN IF EXISTS tipo_ticket_id;
ALTER TABLE asistentes DROP COLUMN IF EXISTS codigo_ticket;

-- Paso 5: Agregar constraint de email único
ALTER TABLE asistentes ADD CONSTRAINT asistentes_email_unique UNIQUE (email);

-- Paso 6: Habilitar RLS en asistencias
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- Paso 7: Crear políticas RLS para asistencias
CREATE POLICY "Administradores acceso completo asistencias" 
ON asistencias FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Usuarios autenticados pueden leer asistencias" 
ON asistencias FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden crear asistencias" 
ON asistencias FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar asistencias" 
ON asistencias FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar asistencias" 
ON asistencias FOR DELETE 
USING (true);

-- Paso 8: Crear trigger para actualizar updated_at en asistencias
CREATE TRIGGER actualizar_asistencias_updated_at
  BEFORE UPDATE ON asistencias
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at();

-- Paso 9: Comentarios
COMMENT ON TABLE asistencias IS 'Tabla intermedia que relaciona asistentes con eventos. Un asistente puede tener múltiples asistencias a diferentes eventos.';
COMMENT ON COLUMN asistentes.email IS 'Email único del asistente. No se pueden repetir emails.';