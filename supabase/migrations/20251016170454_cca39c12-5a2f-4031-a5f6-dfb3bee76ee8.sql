-- Hacer el campo nombre nullable en la tabla asistentes
-- Esto permite importar asistentes sin nombre
ALTER TABLE asistentes ALTER COLUMN nombre DROP NOT NULL;