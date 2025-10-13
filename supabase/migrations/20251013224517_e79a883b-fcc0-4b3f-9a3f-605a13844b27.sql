-- Agregar política para permitir que usuarios autenticados creen reembolsos
CREATE POLICY "Usuarios autenticados pueden crear reembolsos"
ON public.reembolsos
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Agregar política para que usuarios autenticados puedan ver reembolsos
CREATE POLICY "Usuarios autenticados pueden ver reembolsos"
ON public.reembolsos
FOR SELECT
TO authenticated
USING (true);