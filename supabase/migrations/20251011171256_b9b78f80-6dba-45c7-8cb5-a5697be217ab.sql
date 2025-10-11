-- Hacer el campo creado_por nullable en campanas_email
ALTER TABLE campanas_email 
ALTER COLUMN creado_por DROP NOT NULL;