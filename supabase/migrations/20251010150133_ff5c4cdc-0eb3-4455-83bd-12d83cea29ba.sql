-- 1. Agregar columnas de control de notificación a canjes
ALTER TABLE canjes 
ADD COLUMN IF NOT EXISTS email_error_enviado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_email_error timestamp with time zone;

-- 2. Crear índice para optimizar consultas (usando nombre correcto de columna)
CREATE INDEX IF NOT EXISTS idx_canjes_error_tp_email 
ON canjes("ERROR_TP") 
WHERE "ERROR_TP" = true AND email_error_enviado = false;

-- 3. Habilitar extensión pg_net si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 4. Crear función que se ejecuta en el trigger
CREATE OR REPLACE FUNCTION notificar_error_canje_trigger()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url text;
  service_role_key text;
BEGIN
  -- Solo ejecutar si ERROR_TP cambió a true y no se ha enviado email
  IF NEW."ERROR_TP" = true 
     AND (OLD."ERROR_TP" IS NULL OR OLD."ERROR_TP" = false)
     AND (NEW.email_error_enviado IS NULL OR NEW.email_error_enviado = false) THEN
    
    -- URL del edge function
    function_url := 'https://zhvfoyglmdhsmavzbevc.supabase.co/functions/v1/notificar-error-canje';
    
    -- Obtener service role key
    service_role_key := current_setting('app.settings.service_role_key', true);
    
    -- Llamar edge function de forma asíncrona
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(service_role_key, '')
      ),
      body := jsonb_build_object('canje_id', NEW.id::text)
    );
    
    -- Log para debugging
    RAISE NOTICE 'Notificación de error de canje enviada para canje_id: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Crear trigger que detecta cambios en ERROR_TP
DROP TRIGGER IF EXISTS trigger_notificar_error_canje ON canjes;
CREATE TRIGGER trigger_notificar_error_canje
  AFTER INSERT OR UPDATE OF "ERROR_TP"
  ON canjes
  FOR EACH ROW
  EXECUTE FUNCTION notificar_error_canje_trigger();

-- 6. Crear tabla de logs para auditoría
CREATE TABLE IF NOT EXISTS logs_notificaciones_canje (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canje_id uuid REFERENCES canjes(id) ON DELETE SET NULL,
  email_enviado_a varchar,
  estado varchar CHECK (estado IN ('exitoso', 'fallido', 'pendiente')),
  error_mensaje text,
  created_at timestamptz DEFAULT now()
);

-- 7. Habilitar RLS en la tabla de logs
ALTER TABLE logs_notificaciones_canje ENABLE ROW LEVEL SECURITY;

-- 8. Policy para que admins vean los logs
CREATE POLICY "Admins pueden ver logs de notificaciones"
ON logs_notificaciones_canje
FOR SELECT
USING (is_admin());