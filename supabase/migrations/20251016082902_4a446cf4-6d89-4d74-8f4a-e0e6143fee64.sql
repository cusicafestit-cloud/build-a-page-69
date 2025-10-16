-- Agregar columnas para configuración de cuotas en cursos
ALTER TABLE public.cursos
ADD COLUMN permite_cuotas BOOLEAN DEFAULT false,
ADD COLUMN max_cuotas INTEGER DEFAULT 1,
ADD COLUMN frecuencia_dias_cuotas INTEGER DEFAULT 30;

-- Agregar constraint para validar que max_cuotas sea mayor a 0
ALTER TABLE public.cursos
ADD CONSTRAINT check_max_cuotas_positivo CHECK (max_cuotas > 0);

-- Agregar constraint para validar que frecuencia_dias_cuotas sea mayor a 0
ALTER TABLE public.cursos
ADD CONSTRAINT check_frecuencia_dias_positivo CHECK (frecuencia_dias_cuotas > 0);