-- Eliminar columna capacidad de la tabla eventos
ALTER TABLE public.eventos DROP COLUMN IF EXISTS capacidad CASCADE;