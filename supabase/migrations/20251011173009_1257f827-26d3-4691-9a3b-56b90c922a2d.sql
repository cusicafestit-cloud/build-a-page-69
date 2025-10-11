-- Agregar columna nombre a campanas_email
ALTER TABLE campanas_email 
ADD COLUMN IF NOT EXISTS nombre VARCHAR(255);

-- Actualizar campañas existentes que no tengan nombre
UPDATE campanas_email 
SET nombre = asunto 
WHERE nombre IS NULL;