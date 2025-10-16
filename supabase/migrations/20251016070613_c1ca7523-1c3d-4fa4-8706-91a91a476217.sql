-- Primero eliminar la política problemática
DROP POLICY IF EXISTS "Users can create their own initial profile" ON usuarios_sistema;

-- Crear una función security definer para verificar si puede crear su perfil
CREATE OR REPLACE FUNCTION public.can_create_own_profile(user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.usuarios_sistema WHERE email = user_email
  )
$$;

-- Crear política usando la función
CREATE POLICY "Users can create their own initial profile"
ON usuarios_sistema
FOR INSERT
TO authenticated
WITH CHECK (
  can_create_own_profile(email)
  AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
);