-- Paso 1: Eliminar temporalmente el constraint de vendidos
ALTER TABLE eventos DROP CONSTRAINT IF EXISTS eventos_vendidos_check;
ALTER TABLE tipos_tickets DROP CONSTRAINT IF EXISTS tipos_tickets_vendidos_check;

-- Paso 2: Eliminar asistentes sin evento_id o tipo_ticket_id
DELETE FROM asistentes 
WHERE evento_id IS NULL OR tipo_ticket_id IS NULL;

-- Paso 3: Hacer evento_id NOT NULL
ALTER TABLE asistentes 
  ALTER COLUMN evento_id SET NOT NULL;

-- Paso 4: Hacer tipo_ticket_id NOT NULL
ALTER TABLE asistentes 
  ALTER COLUMN tipo_ticket_id SET NOT NULL;

-- Paso 5: Recalcular vendidos correctamente para todos los eventos
UPDATE eventos e
SET vendidos = COALESCE((
  SELECT COUNT(*) 
  FROM asistentes a 
  WHERE a.evento_id = e.id 
  AND a.estado = 'confirmado'
), 0);

-- Paso 6: Recalcular vendidos para todos los tipos de tickets
UPDATE tipos_tickets tt
SET vendidos = COALESCE((
  SELECT COUNT(*) 
  FROM asistentes a 
  WHERE a.tipo_ticket_id = tt.id 
  AND a.estado = 'confirmado'
), 0);

-- Paso 7: Volver a agregar el constraint de vendidos
ALTER TABLE eventos ADD CONSTRAINT eventos_vendidos_check CHECK (vendidos >= 0);
ALTER TABLE tipos_tickets ADD CONSTRAINT tipos_tickets_vendidos_check CHECK (vendidos >= 0);

-- Paso 8: Agregar comentarios para documentar
COMMENT ON COLUMN asistentes.evento_id IS 'ID del evento al que asiste. Campo obligatorio - no puede haber asistentes sin evento.';
COMMENT ON COLUMN asistentes.tipo_ticket_id IS 'ID del tipo de ticket del asistente. Campo obligatorio.';