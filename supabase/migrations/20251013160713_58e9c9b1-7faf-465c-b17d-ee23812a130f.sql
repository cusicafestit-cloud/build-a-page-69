-- Eliminar columnas innecesarias de reembolsos usando CASCADE
ALTER TABLE reembolsos 
  DROP COLUMN IF EXISTS comision CASCADE,
  DROP COLUMN IF EXISTS monto_neto CASCADE,
  DROP COLUMN IF EXISTS motivo CASCADE,
  DROP COLUMN IF EXISTS tp_id CASCADE;

-- Agregar columnas para datos bancarios
ALTER TABLE reembolsos 
  ADD COLUMN banco VARCHAR(100),
  ADD COLUMN codigo_banco VARCHAR(10),
  ADD COLUMN fecha_transferencia DATE,
  ADD COLUMN numero_cuenta VARCHAR(100);

-- Crear índices para mejorar búsqueda de asistentes y eventos
CREATE INDEX IF NOT EXISTS idx_asistentes_nombre ON asistentes(nombre);
CREATE INDEX IF NOT EXISTS idx_asistentes_apellido ON asistentes(apellido);
CREATE INDEX IF NOT EXISTS idx_asistentes_email ON asistentes(email);
CREATE INDEX IF NOT EXISTS idx_asistentes_codigo_ticket ON asistentes(codigo_ticket);
CREATE INDEX IF NOT EXISTS idx_eventos_nombre ON eventos(nombre);

-- Comentarios
COMMENT ON COLUMN reembolsos.banco IS 'Nombre del banco para transferencia';
COMMENT ON COLUMN reembolsos.codigo_banco IS 'Código del banco venezolano';
COMMENT ON COLUMN reembolsos.fecha_transferencia IS 'Fecha de la transferencia bancaria';
COMMENT ON COLUMN reembolsos.numero_cuenta IS 'Número de cuenta bancaria del cliente';