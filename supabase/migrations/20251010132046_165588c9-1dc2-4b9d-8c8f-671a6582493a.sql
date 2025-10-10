-- Crear enum para roles de aplicación
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Crear tabla de roles de usuario
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Habilitar RLS en user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política para que admins puedan ver todos los roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) OR user_id = auth.uid()
);

-- Política para que admins puedan gestionar roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Crear función segura para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Crear función para verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Actualizar políticas de canjes para usar el nuevo sistema de roles
DROP POLICY IF EXISTS "Administradores acceso completo canjes por email" ON canjes;
DROP POLICY IF EXISTS "Administradores acceso completo canjes" ON canjes;

CREATE POLICY "Admins can manage all canjes"
ON public.canjes
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- La política de inserción pública ya existe, la mantenemos
-- "Permitir inserción de canjes públicos" permite INSERT con true

-- Insertar el usuario admin basado en el email admin@cusica.com
-- Primero obtenemos el user_id del email
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar el user_id del admin por email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@cusica.com';
  
  -- Si existe, insertar el rol (ignorar si ya existe)
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;