-- Eliminar columnas evento_destino_id y tipo_ticket_destino_id de la tabla canjes
ALTER TABLE canjes 
DROP COLUMN IF EXISTS evento_destino_id,
DROP COLUMN IF EXISTS tipo_ticket_destino_id;

-- Agregar comentario documentando el cambio
COMMENT ON TABLE canjes IS 'Tabla de canjes de tickets. Ya no requiere evento destino ni tipo de ticket destino.';