-- Add promotional images fields to cursos table
ALTER TABLE public.cursos 
ADD COLUMN IF NOT EXISTS imagen_promo_1 TEXT,
ADD COLUMN IF NOT EXISTS imagen_promo_2 TEXT,
ADD COLUMN IF NOT EXISTS imagen_promo_3 TEXT;