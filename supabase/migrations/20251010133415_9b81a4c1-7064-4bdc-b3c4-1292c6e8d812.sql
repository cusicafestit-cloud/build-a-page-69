-- Agregar nuevas columnas a la tabla canjes
ALTER TABLE canjes 
ADD COLUMN IF NOT EXISTS ticket_ids text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS invoice_id text,
ADD COLUMN IF NOT EXISTS canjeado_tp boolean DEFAULT false;

-- Agregar comentarios para documentar las columnas
COMMENT ON COLUMN canjes.ticket_ids IS 'Array de IDs de tickets asociados al canje';
COMMENT ON COLUMN canjes.invoice_id IS 'ID de la factura asociada al canje';
COMMENT ON COLUMN canjes.canjeado_tp IS 'Indica si el canje ha sido procesado en TicketPro';