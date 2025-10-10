-- Eliminar la constraint unique_canje_activo que impide crear múltiples canjes
ALTER TABLE canjes DROP CONSTRAINT IF EXISTS unique_canje_activo;