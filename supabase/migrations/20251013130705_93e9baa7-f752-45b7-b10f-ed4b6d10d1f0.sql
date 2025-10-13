-- Migration: Modify asistentes table structure
-- Drop dependent view first, modify table, then recreate view

-- Step 1: Drop the dependent view temporarily
DROP VIEW IF EXISTS public.vista_estadisticas_asistentes;

-- Step 2: Add new columns to asistentes table
ALTER TABLE public.asistentes
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS seccion TEXT,
  ADD COLUMN IF NOT EXISTS tiketera TEXT,
  ADD COLUMN IF NOT EXISTS fecha_compra TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS evento_nombre TEXT,
  ADD COLUMN IF NOT EXISTS tipo_ticket_nombre TEXT;

-- Step 3: Populate evento_nombre with existing event names
UPDATE public.asistentes a
SET evento_nombre = e.nombre
FROM public.eventos e
WHERE a.evento_id = e.id
  AND a.evento_nombre IS NULL;

-- Step 4: Populate tipo_ticket_nombre with existing ticket type names
UPDATE public.asistentes a
SET tipo_ticket_nombre = tt.tipo
FROM public.tipos_tickets tt
WHERE a.tipo_ticket_id = tt.id
  AND a.tipo_ticket_nombre IS NULL;

-- Step 5: Drop obsolete columns
ALTER TABLE public.asistentes
  DROP COLUMN IF EXISTS fecha_check_in,
  DROP COLUMN IF EXISTS codigo_ticket,
  DROP COLUMN IF EXISTS ciudad;

-- Step 6: Recreate the statistics view without removed columns
CREATE VIEW public.vista_estadisticas_asistentes AS
SELECT 
  COUNT(*) AS total_asistentes,
  COUNT(DISTINCT email) AS emails_unicos,
  SUM(CASE WHEN estado = 'confirmado' THEN 1 ELSE 0 END) AS asistentes_confirmados,
  SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS asistentes_pendientes,
  SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) AS asistentes_cancelados
FROM public.asistentes;