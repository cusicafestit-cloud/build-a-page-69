-- Habilitar replica identity full para capturar todos los cambios
ALTER TABLE public.canjes REPLICA IDENTITY FULL;
ALTER TABLE public.asistentes REPLICA IDENTITY FULL;
ALTER TABLE public.eventos REPLICA IDENTITY FULL;
ALTER TABLE public.tipos_tickets REPLICA IDENTITY FULL;

-- Agregar las tablas a la publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.canjes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.asistentes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.eventos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tipos_tickets;