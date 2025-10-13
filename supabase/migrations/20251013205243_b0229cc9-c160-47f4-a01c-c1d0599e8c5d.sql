-- Eliminar completamente todos los triggers y funciones relacionados con codigo_ticket en asistentes
DROP TRIGGER IF EXISTS trigger_generar_codigo_ticket ON asistentes CASCADE;
DROP TRIGGER IF EXISTS actualizar_codigo_ticket ON asistentes CASCADE;
DROP FUNCTION IF EXISTS generar_codigo_ticket(uuid) CASCADE;
DROP FUNCTION IF EXISTS trigger_generar_codigo_ticket() CASCADE;

-- Verificar que no existan otros triggers en asistentes relacionados con codigo_ticket
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'asistentes'
        AND tgname LIKE '%codigo%'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.tgname || ' ON asistentes CASCADE';
    END LOOP;
END $$;