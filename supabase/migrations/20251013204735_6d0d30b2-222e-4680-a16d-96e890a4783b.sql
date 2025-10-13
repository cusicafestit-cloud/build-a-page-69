-- Agregar asistencias aleatorias a asistentes existentes que no tienen registros
DO $$
DECLARE
  asistente_record RECORD;
  evento_record RECORD;
  tipo_ticket_record RECORD;
  random_event_count INTEGER;
BEGIN
  -- Para cada asistente que no tiene asistencias
  FOR asistente_record IN 
    SELECT a.id, a.email
    FROM asistentes a
    LEFT JOIN asistencias ast ON a.id = ast.asistente_id
    WHERE ast.id IS NULL
  LOOP
    -- Generar entre 1 y 3 eventos aleatorios por asistente
    random_event_count := floor(random() * 3 + 1)::INTEGER;
    
    -- Seleccionar eventos y tipos de tickets aleatorios
    FOR evento_record IN 
      SELECT DISTINCT ON (e.id) 
        e.id as evento_id,
        tt.id as tipo_ticket_id
      FROM eventos e
      CROSS JOIN LATERAL (
        SELECT id 
        FROM tipos_tickets 
        WHERE evento_id = e.id 
        ORDER BY random() 
        LIMIT 1
      ) tt
      ORDER BY random()
      LIMIT random_event_count
    LOOP
      -- Insertar la asistencia
      INSERT INTO asistencias (
        asistente_id,
        evento_id,
        tipo_ticket_id,
        codigo_ticket,
        estado,
        fecha_compra
      ) VALUES (
        asistente_record.id,
        evento_record.evento_id,
        evento_record.tipo_ticket_id,
        'TKT-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || upper(substr(md5(random()::text), 1, 6)),
        'confirmado',
        NOW() - (random() * INTERVAL '30 days')
      )
      ON CONFLICT (asistente_id, evento_id, tipo_ticket_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;