-- Eliminar trigger obsoleto de asistentes que causa conflicto
DROP TRIGGER IF EXISTS trigger_generar_codigo_ticket ON asistentes;

-- Crear trigger para generar código de ticket automáticamente en asistencias
CREATE OR REPLACE FUNCTION generar_codigo_ticket_asistencias()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo_ticket IS NULL OR NEW.codigo_ticket = '' THEN
        NEW.codigo_ticket := 'TKT-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || upper(substr(md5(random()::text), 1, 6));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generar_codigo_ticket_asistencias ON asistencias;

CREATE TRIGGER trigger_generar_codigo_ticket_asistencias
    BEFORE INSERT ON asistencias
    FOR EACH ROW
    EXECUTE FUNCTION generar_codigo_ticket_asistencias();