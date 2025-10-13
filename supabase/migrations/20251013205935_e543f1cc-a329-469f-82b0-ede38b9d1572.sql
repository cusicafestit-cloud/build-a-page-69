-- Agregar foreign keys a la tabla asistencias
ALTER TABLE asistencias
  ADD CONSTRAINT asistencias_asistente_id_fkey 
  FOREIGN KEY (asistente_id) 
  REFERENCES asistentes(id) 
  ON DELETE CASCADE;

ALTER TABLE asistencias
  ADD CONSTRAINT asistencias_evento_id_fkey 
  FOREIGN KEY (evento_id) 
  REFERENCES eventos(id) 
  ON DELETE CASCADE;

ALTER TABLE asistencias
  ADD CONSTRAINT asistencias_tipo_ticket_id_fkey 
  FOREIGN KEY (tipo_ticket_id) 
  REFERENCES tipos_tickets(id) 
  ON DELETE CASCADE;