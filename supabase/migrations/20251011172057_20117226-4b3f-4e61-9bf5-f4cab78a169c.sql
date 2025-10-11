
-- Eliminar la restricción de foreign key en envios_email.suscriptor_id
ALTER TABLE envios_email 
DROP CONSTRAINT IF EXISTS envios_email_suscriptor_id_fkey;

-- Hacer suscriptor_id nullable ya que puede no existir en suscriptores_email
ALTER TABLE envios_email 
ALTER COLUMN suscriptor_id DROP NOT NULL;
