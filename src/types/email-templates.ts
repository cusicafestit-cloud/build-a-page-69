/**
 * Tipos TypeScript para el sistema de plantillas de email marketing
 */

export type EmailTemplate = {
  id: string;
  nombre: string;
  descripcion?: string;
  asunto_predeterminado?: string;
  contenido_html: string;
  contenido_texto?: string;
  variables_disponibles: string[];
  categoria?: string;
  es_predeterminada: boolean;
  activa: boolean;
  usuario_creador?: string;
  created_at: string;
  updated_at: string;
};

export type EmailTemplateFormData = Omit<
  EmailTemplate,
  "id" | "created_at" | "updated_at" | "usuario_creador"
>;

export type TemplateVariable = {
  key: string;
  label: string;
  example: string;
  description?: string;
};

/**
 * Variables disponibles para usar en las plantillas de email
 * Se usan con doble llave: {{variable}}
 */
export const AVAILABLE_VARIABLES: TemplateVariable[] = [
  {
    key: "{{nombre}}",
    label: "Nombre del destinatario",
    example: "Juan Pérez",
    description: "Nombre completo del asistente",
  },
  {
    key: "{{email}}",
    label: "Email del destinatario",
    example: "juan@email.com",
    description: "Correo electrónico del asistente",
  },
  {
    key: "{{evento}}",
    label: "Nombre del evento",
    example: "Festival de Rock 2025",
    description: "Nombre completo del evento",
  },
  {
    key: "{{fecha}}",
    label: "Fecha del evento",
    example: "15/12/2025",
    description: "Fecha en formato DD/MM/YYYY",
  },
  {
    key: "{{lugar}}",
    label: "Lugar del evento",
    example: "Arena México",
    description: "Ubicación donde se realizará el evento",
  },
  {
    key: "{{codigo_ticket}}",
    label: "Código de ticket",
    example: "TICK-12345",
    description: "Código único del ticket del asistente",
  },
];

/**
 * Categorías de plantillas disponibles
 */
export const TEMPLATE_CATEGORIES = [
  { value: "evento", label: "Evento" },
  { value: "promocion", label: "Promoción" },
  { value: "recordatorio", label: "Recordatorio" },
  { value: "confirmacion", label: "Confirmación" },
  { value: "bienvenida", label: "Bienvenida" },
] as const;

/**
 * Plantilla HTML base para empezar
 */
export const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 40px;
    }
    .header {
      text-align: center;
      color: #6366f1;
      font-size: 28px;
      margin-bottom: 20px;
    }
    .content {
      color: #333;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      background: #6366f1;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      Hola {{nombre}}
    </div>
    <div class="content">
      <p>Este es el contenido de tu email.</p>
      <p>Puedes usar variables como {{evento}}, {{fecha}}, {{lugar}}.</p>
      <a href="#" class="button">Botón de Acción</a>
    </div>
    <div class="footer">
      <p>© 2025 Cusica Event Management</p>
    </div>
  </div>
</body>
</html>`;

/**
 * Reemplaza las variables en una plantilla con valores reales o ejemplos
 */
export function replaceTemplateVariables(
  template: string,
  values?: Record<string, string>
): string {
  let result = template;

  // Si no hay valores, usar ejemplos
  if (!values) {
    AVAILABLE_VARIABLES.forEach((variable) => {
      const regex = new RegExp(variable.key.replace(/[{}]/g, "\\$&"), "g");
      result = result.replace(regex, variable.example);
    });
  } else {
    // Reemplazar con valores reales
    Object.entries(values).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, value || "");
    });
  }

  return result;
}
