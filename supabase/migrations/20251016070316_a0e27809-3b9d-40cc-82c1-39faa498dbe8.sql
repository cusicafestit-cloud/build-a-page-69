-- Agregar política para permitir que un usuario recién creado pueda insertar su propio registro
CREATE POLICY "Users can create their own initial profile"
ON usuarios_sistema
FOR INSERT
TO authenticated
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND NOT EXISTS (
    SELECT 1 FROM usuarios_sistema WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);