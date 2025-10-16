-- Agregar columnas para contenido rico en cursos
ALTER TABLE public.cursos
ADD COLUMN IF NOT EXISTS lo_que_aprenderas TEXT,
ADD COLUMN IF NOT EXISTS modulos TEXT;