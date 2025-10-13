-- Eliminar TODOS los triggers de la tabla asistentes
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'asistentes'
        AND NOT tgisinternal
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.tgname || ' ON asistentes CASCADE';
        RAISE NOTICE 'Dropped trigger: %', trigger_record.tgname;
    END LOOP;
END $$;

-- Verificar y eliminar funciones que referencian asistentes.evento_id
DROP FUNCTION IF EXISTS actualizar_estadisticas_evento() CASCADE;
DROP FUNCTION IF EXISTS actualizar_vendidos() CASCADE;