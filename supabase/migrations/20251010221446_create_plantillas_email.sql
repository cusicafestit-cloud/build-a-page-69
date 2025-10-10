-- Crear tabla plantillas_email para sistema de templates de email marketing
-- Similar a Mailchimp: permite crear, guardar y reutilizar plantillas HTML

create table plantillas_email (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(255) not null,
  descripcion text,
  asunto_predeterminado varchar(500),
  contenido_html text not null,
  contenido_texto text,
  variables_disponibles jsonb default '[]'::jsonb,
  categoria varchar(100),
  es_predeterminada boolean default false,
  activa boolean default true,
  usuario_creador uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  constraint plantillas_email_nombre_check check (char_length(nombre) > 0),
  constraint plantillas_email_html_check check (char_length(contenido_html) > 0)
);

comment on table plantillas_email is 'Plantillas de email para campañas de marketing - sistema tipo Mailchimp';
comment on column plantillas_email.nombre is 'Nombre descriptivo de la plantilla';
comment on column plantillas_email.contenido_html is 'Contenido HTML de la plantilla con variables {{variable}}';
comment on column plantillas_email.variables_disponibles is 'Array JSON de variables disponibles en la plantilla';
comment on column plantillas_email.categoria is 'Categoría: evento, promocion, recordatorio, etc';

-- Índices para optimización
create index idx_plantillas_email_categoria on plantillas_email(categoria);
create index idx_plantillas_email_activa on plantillas_email(activa);
create index idx_plantillas_email_usuario on plantillas_email(usuario_creador);
create index idx_plantillas_email_created on plantillas_email(created_at desc);

-- Habilitar RLS
alter table plantillas_email enable row level security;

-- Política: Usuarios autenticados pueden leer plantillas activas
create policy "Usuarios autenticados pueden leer plantillas activas"
on plantillas_email
for select
to authenticated
using (activa = true);

-- Política: Admins pueden gestionar todas las plantillas
create policy "Admins pueden gestionar todas las plantillas"
on plantillas_email
for all
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

-- Trigger para actualizar updated_at automáticamente
create or replace function update_plantillas_email_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger update_plantillas_email_updated_at_trigger
before update on plantillas_email
for each row
execute function update_plantillas_email_updated_at();

-- Insertar plantillas predeterminadas para empezar
insert into plantillas_email (nombre, descripcion, asunto_predeterminado, contenido_html, contenido_texto, categoria, es_predeterminada, variables_disponibles) values
(
  'Confirmación de Ticket',
  'Plantilla profesional para confirmar la compra de tickets',
  '¡Tu ticket para {{evento}} está listo! 🎉',
  '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Ticket</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #333; margin-bottom: 20px; }
    .ticket-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 8px; }
    .ticket-box h3 { margin: 0 0 15px 0; color: #667eea; }
    .ticket-info { margin: 10px 0; color: #555; }
    .ticket-info strong { color: #333; }
    .code-box { background: #fff3cd; border: 2px dashed #ffc107; padding: 15px; margin: 20px 0; text-align: center; border-radius: 8px; }
    .code-box .code { font-size: 24px; font-weight: bold; color: #333; letter-spacing: 2px; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold; }
    .footer { background: #333; color: white; padding: 30px; text-align: center; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎫 Confirmación de Ticket</h1>
    </div>
    <div class="content">
      <div class="greeting">¡Hola {{nombre}}!</div>
      <p>Nos complace confirmar tu registro para el evento. Tu ticket ha sido generado exitosamente.</p>
      
      <div class="ticket-box">
        <h3>📋 Detalles del Evento</h3>
        <div class="ticket-info"><strong>Evento:</strong> {{evento}}</div>
        <div class="ticket-info"><strong>Fecha:</strong> {{fecha}}</div>
        <div class="ticket-info"><strong>Lugar:</strong> {{lugar}}</div>
      </div>

      <div class="code-box">
        <p style="margin: 0 0 10px 0; color: #856404;">Tu código de ticket:</p>
        <div class="code">{{codigo_ticket}}</div>
      </div>

      <p>Por favor guarda este email como comprobante. Lo necesitarás para ingresar al evento.</p>
      
      <div style="text-align: center;">
        <a href="#" class="button">Ver Mi Ticket</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2025 Cusica Event Management</p>
      <p>Este es un email automático, por favor no responder.</p>
    </div>
  </div>
</body>
</html>',
  'Hola {{nombre}},

Nos complace confirmar tu registro para {{evento}}.

Detalles del Evento:
- Evento: {{evento}}
- Fecha: {{fecha}}
- Lugar: {{lugar}}
- Código de Ticket: {{codigo_ticket}}

Por favor guarda este email como comprobante.

Saludos,
Cusica Event Management',
  'evento',
  true,
  '["{{nombre}}", "{{evento}}", "{{fecha}}", "{{lugar}}", "{{codigo_ticket}}"]'::jsonb
),
(
  'Promoción Especial',
  'Plantilla atractiva para ofertas y promociones exclusivas',
  '🔥 ¡Oferta exclusiva de {{evento}}!',
  '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Promoción Especial</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 50px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 32px; }
    .promo-badge { background: #fef3c7; color: #92400e; padding: 15px 25px; border-radius: 50px; display: inline-block; font-size: 18px; font-weight: bold; margin-top: 15px; }
    .content { padding: 40px 30px; }
    .event-name { font-size: 24px; color: #667eea; font-weight: bold; text-align: center; margin: 20px 0; }
    .offer-box { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; }
    .offer-box h2 { margin: 0 0 10px 0; font-size: 28px; color: #c2410c; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; margin-top: 20px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
    .footer { background: #1f2937; color: white; padding: 30px; text-align: center; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ¡Oferta Exclusiva!</h1>
      <div class="promo-badge">SOLO POR TIEMPO LIMITADO</div>
    </div>
    <div class="content">
      <p style="text-align: center; font-size: 18px; color: #555;">Hola <strong>{{nombre}}</strong>,</p>
      <p style="text-align: center;">Tenemos una oferta especial exclusiva para ti.</p>
      
      <div class="event-name">{{evento}}</div>
      
      <div class="offer-box">
        <h2>¡Descuento Especial!</h2>
        <p style="font-size: 16px; color: #7c2d12; margin: 0;">No dejes pasar esta oportunidad única</p>
      </div>

      <p style="text-align: center; color: #666;">Esta oferta es válida solo por tiempo limitado. ¡Aprovéchala ahora!</p>
      
      <div style="text-align: center;">
        <a href="#" class="button">APROVECHAR OFERTA →</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2025 Cusica Event Management</p>
      <p>Para dejar de recibir emails promocionales, haz clic aquí.</p>
    </div>
  </div>
</body>
</html>',
  'Hola {{nombre}},

¡Tenemos una oferta exclusiva para ti!

{{evento}}

Descuento especial por tiempo limitado.

No dejes pasar esta oportunidad única.

Saludos,
Cusica Event Management',
  'promocion',
  true,
  '["{{nombre}}", "{{evento}}"]'::jsonb
),
(
  'Recordatorio de Evento',
  'Plantilla simple para recordatorios de eventos próximos',
  '⏰ Recordatorio: {{evento}} es mañana',
  '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Evento</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #3b82f6; padding: 30px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 40px 30px; }
    .reminder-box { background: #eff6ff; border: 2px solid #3b82f6; padding: 25px; border-radius: 10px; margin: 20px 0; }
    .reminder-box h2 { color: #1e40af; margin: 0 0 15px 0; }
    .info-row { margin: 12px 0; color: #374151; font-size: 16px; }
    .icon { display: inline-block; width: 20px; margin-right: 10px; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Recordatorio de Evento</h1>
    </div>
    <div class="content">
      <p>Hola <strong>{{nombre}}</strong>,</p>
      <p>Este es un recordatorio amigable de que tu evento se acerca.</p>
      
      <div class="reminder-box">
        <h2>{{evento}}</h2>
        <div class="info-row"><span class="icon">📅</span> <strong>Fecha:</strong> {{fecha}}</div>
        <div class="info-row"><span class="icon">📍</span> <strong>Lugar:</strong> {{lugar}}</div>
        <div class="info-row"><span class="icon">🎫</span> <strong>Tu código:</strong> {{codigo_ticket}}</div>
      </div>

      <p>Te esperamos. ¡No olvides llevar tu ticket!</p>
    </div>
    <div class="footer">
      <p>© 2025 Cusica Event Management</p>
    </div>
  </div>
</body>
</html>',
  null,
  'recordatorio',
  true,
  '["{{nombre}}", "{{evento}}", "{{fecha}}", "{{lugar}}", "{{codigo_ticket}}"]'::jsonb
);
