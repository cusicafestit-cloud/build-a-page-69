
-- Insertar rol de admin para cusicafestit@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('e2c76e08-5d07-479f-b1d9-b2773dd20d14', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
