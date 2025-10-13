-- Agregar columna codigo_ticket que falta en la tabla asistentes
-- Esta columna es requerida por el trigger trigger_generar_codigo_ticket
ALTER TABLE asistentes 
ADD COLUMN IF NOT EXISTS codigo_ticket VARCHAR(50) UNIQUE;