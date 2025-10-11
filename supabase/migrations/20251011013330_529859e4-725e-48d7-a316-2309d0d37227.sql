-- Crear función de base de datos para ejecutar consultas readonly de forma segura
CREATE OR REPLACE FUNCTION execute_readonly_query(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_data JSONB;
  query_upper TEXT;
BEGIN
  -- Verificar que solo sea SELECT
  query_upper := UPPER(TRIM(query_text));
  IF NOT query_upper LIKE 'SELECT%' THEN
    RAISE EXCEPTION 'Solo se permiten consultas SELECT';
  END IF;

  -- Ejecutar la consulta y obtener resultados como JSONB
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', query_text) INTO result_data;
  
  RETURN COALESCE(result_data, '[]'::jsonb);
END;
$$;

-- Agregar columnas nuevas a validaciones_bd
ALTER TABLE validaciones_bd 
ADD COLUMN IF NOT EXISTS historial_ejecuciones JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notificaciones_habilitadas BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS emails_notificacion TEXT[];

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_validaciones_activa ON validaciones_bd(activa);
CREATE INDEX IF NOT EXISTS idx_validaciones_estado ON validaciones_bd(estado);
CREATE INDEX IF NOT EXISTS idx_validaciones_proxima_ejecucion ON validaciones_bd(proxima_ejecucion);

-- Habilitar Realtime para validaciones_bd
ALTER TABLE validaciones_bd REPLICA IDENTITY FULL;

-- Insertar validaciones iniciales si no existen
INSERT INTO validaciones_bd (nombre, descripcion, consulta_sql, tipo, activa, frecuencia_horas, umbral_advertencia, umbral_error)
VALUES 
  ('Tickets vendidos mayor a capacidad', 'Detecta eventos donde se vendieron más tickets de los disponibles', 
   'SELECT e.nombre, e.id, tt.tipo, tt.vendidos, tt.capacidad FROM eventos e JOIN tipos_tickets tt ON tt.evento_id = e.id WHERE tt.vendidos > tt.capacidad', 
   'integridad', true, 24, 1, 5),
  
  ('Canjes sin asistente asociado', 'Detecta canjes que no tienen un asistente válido asociado',
   'SELECT c.id, c.correo, c.estado FROM canjes c LEFT JOIN asistentes a ON c.asistente_id = a.id WHERE c.asistente_id IS NULL OR a.id IS NULL',
   'integridad', true, 12, 1, 10),
  
  ('Asistentes sin información de contacto', 'Detecta asistentes sin teléfono ni documento de identidad',
   'SELECT id, nombre, apellido, email FROM asistentes WHERE (telefono IS NULL OR telefono = '''') AND (documento_identidad IS NULL OR documento_identidad = '''')',
   'consistencia', true, 24, 50, 100),
  
  ('Eventos pasados sin check-ins', 'Detecta eventos que ya pasaron pero no tienen ningún check-in registrado',
   'SELECT e.id, e.nombre, e.fecha, COUNT(a.id) as total_asistentes FROM eventos e LEFT JOIN asistentes a ON a.evento_id = e.id WHERE e.fecha < CURRENT_DATE AND e.estado = ''finalizado'' GROUP BY e.id, e.nombre, e.fecha HAVING COUNT(CASE WHEN a.fecha_check_in IS NOT NULL THEN 1 END) = 0',
   'consistencia', true, 24, 1, 5),
  
  ('Duplicados de email en asistentes', 'Detecta emails duplicados que puedan causar problemas',
   'SELECT email, COUNT(*) as cantidad FROM asistentes GROUP BY email HAVING COUNT(*) > 3',
   'consistencia', true, 12, 5, 10),
  
  ('Canjes en estado de error TP sin procesar', 'Detecta canjes con errores de TuSDK que no han sido procesados',
   'SELECT id, correo, evento_tp_id, fecha_solicitud FROM canjes WHERE "ERROR_TP" = true AND estado = ''pendiente''',
   'seguridad', true, 6, 1, 5)
ON CONFLICT DO NOTHING;
