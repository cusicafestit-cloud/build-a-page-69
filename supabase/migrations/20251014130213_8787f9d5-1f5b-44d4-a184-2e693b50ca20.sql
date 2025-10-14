-- Agregar campos para evento y tipo de ticket destino en tabla canjes
ALTER TABLE public.canjes
ADD COLUMN IF NOT EXISTS evento_destino_id uuid REFERENCES public.eventos(id),
ADD COLUMN IF NOT EXISTS evento_destino_nombre text,
ADD COLUMN IF NOT EXISTS evento_destino_tp_id text,
ADD COLUMN IF NOT EXISTS tipo_ticket_destino_id uuid REFERENCES public.tipos_tickets(id),
ADD COLUMN IF NOT EXISTS tipo_ticket_destino_nombre text,
ADD COLUMN IF NOT EXISTS tipo_ticket_destino_tp_id text;

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN public.canjes.evento_destino_id IS 'ID del evento al cual se quiere canjear';
COMMENT ON COLUMN public.canjes.evento_destino_nombre IS 'Nombre del evento destino';
COMMENT ON COLUMN public.canjes.evento_destino_tp_id IS 'TP ID del evento destino';
COMMENT ON COLUMN public.canjes.tipo_ticket_destino_id IS 'ID del tipo de ticket destino';
COMMENT ON COLUMN public.canjes.tipo_ticket_destino_nombre IS 'Nombre del tipo de ticket destino';
COMMENT ON COLUMN public.canjes.tipo_ticket_destino_tp_id IS 'TP ID del tipo de ticket destino';