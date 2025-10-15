-- Crear tabla de roles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  permisos JSONB DEFAULT '{}'::jsonb,
  es_sistema BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Políticas para roles
CREATE POLICY "Todos pueden ver roles activos"
ON public.roles
FOR SELECT
TO authenticated
USING (activo = true);

CREATE POLICY "Solo admins pueden gestionar roles"
ON public.roles
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Insertar roles del sistema (migración de los roles existentes del enum)
INSERT INTO public.roles (nombre, descripcion, es_sistema, activo)
VALUES 
  ('admin', 'Administrador del sistema con acceso completo', true, true),
  ('moderator', 'Moderador con permisos limitados', true, true),
  ('user', 'Usuario estándar', true, true)
ON CONFLICT (nombre) DO NOTHING;

-- Crear nueva tabla user_roles_new con referencia a la tabla roles
CREATE TABLE IF NOT EXISTS public.user_roles_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  asignado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role_id)
);

-- Habilitar RLS
ALTER TABLE public.user_roles_new ENABLE ROW LEVEL SECURITY;

-- Migrar datos existentes si la tabla user_roles tiene datos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    INSERT INTO public.user_roles_new (user_id, role_id, created_at)
    SELECT 
      ur.user_id,
      r.id,
      ur.created_at
    FROM public.user_roles ur
    JOIN public.roles r ON r.nombre = ur.role::text
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;

-- Políticas para user_roles_new
CREATE POLICY "Admins pueden gestionar asignaciones de roles"
ON public.user_roles_new
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Usuarios pueden ver sus propios roles"
ON public.user_roles_new
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_admin());

-- Actualizar función has_role para usar la nueva estructura
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles_new ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND r.nombre = _role_name
      AND r.activo = true
  )
$$;

-- Función auxiliar para verificar admin con la nueva estructura
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Trigger para actualizar updated_at en roles
CREATE OR REPLACE FUNCTION public.actualizar_roles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_actualizar_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_roles_updated_at();

-- Renombrar tablas (si user_roles existe, la respaldamos)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    ALTER TABLE IF EXISTS public.user_roles RENAME TO user_roles_backup_old;
  END IF;
  
  ALTER TABLE public.user_roles_new RENAME TO user_roles;
END $$;