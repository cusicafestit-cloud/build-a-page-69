-- Eliminar todos los triggers de la tabla asistentes que referencian campos que ya no existen
DROP TRIGGER IF EXISTS trigger_actualizar_vendidos_evento ON asistentes CASCADE;
DROP TRIGGER IF EXISTS actualizar_estadisticas_evento ON asistentes CASCADE;
DROP TRIGGER IF EXISTS trigger_update_evento_stats ON asistentes CASCADE;

-- El trigger de actualización de estadísticas debe estar en asistencias, no en asistentes
-- Verificar si ya existe en asistencias
DROP TRIGGER IF EXISTS trigger_actualizar_vendidos_evento ON asistencias CASCADE;

-- Recrear el trigger en la tabla correcta (asistencias)
CREATE TRIGGER trigger_actualizar_vendidos_evento
    AFTER INSERT OR UPDATE OR DELETE ON asistencias
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_vendidos_evento();