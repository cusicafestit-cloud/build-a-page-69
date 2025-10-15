-- Asignar rol admin a los usuarios administradores
DO $$
DECLARE
  admin_role_id UUID := '88cd7c1b-27d3-445e-8ea0-09d371d6e31b';
  admin_user_vl UUID := 'e7770ad5-78d8-445d-a682-a24cc929bbc4';
BEGIN
  -- Asignar a vllorens@cusica.com
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = admin_user_vl AND role_id = admin_role_id
  ) THEN
    INSERT INTO user_roles (user_id, role_id, asignado_por)
    VALUES (admin_user_vl, admin_role_id, NULL);
  END IF;
END $$;

-- Crear y asignar admin@cusica.com si el usuario de auth existe
DO $$
DECLARE
  admin_role_id UUID := '88cd7c1b-27d3-445e-8ea0-09d371d6e31b';
  admin_cusica_id UUID;
BEGIN
  -- Insertar usuario admin@cusica.com si no existe
  INSERT INTO usuarios_sistema (email, nombre, password_hash, rol, estado)
  VALUES ('admin@cusica.com', 'Super Admin', 'temp_hash', 'admin', 'activo')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO admin_cusica_id;
  
  -- Si se insertó o ya existía, obtener su ID
  IF admin_cusica_id IS NULL THEN
    SELECT id INTO admin_cusica_id FROM usuarios_sistema WHERE email = 'admin@cusica.com';
  END IF;
  
  -- Asignar rol admin
  IF admin_cusica_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = admin_cusica_id AND role_id = admin_role_id
  ) THEN
    INSERT INTO user_roles (user_id, role_id, asignado_por)
    VALUES (admin_cusica_id, admin_role_id, NULL);
  END IF;
END $$;