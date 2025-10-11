
-- Eliminar la restricción de foreign key en campanas_email.creado_por
ALTER TABLE campanas_email 
DROP CONSTRAINT IF EXISTS campanas_email_creado_por_fkey;
