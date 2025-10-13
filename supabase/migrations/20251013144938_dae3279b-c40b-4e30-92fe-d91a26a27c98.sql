-- Crear índice único en lower(email) para asistentes
-- Esto previene duplicados por mayúsculas/minúsculas y mejora el rendimiento del UPSERT
CREATE UNIQUE INDEX IF NOT EXISTS ux_asistentes_email_lower 
ON asistentes (LOWER(email));