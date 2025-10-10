/**
 * Tipos TypeScript para el sistema de campañas de email marketing
 */

export type Campaign = {
  id: string;
  nombre: string;
  asunto: string;
  plantilla_id?: string;
  contenido_html: string;
  destinatarios_total: number;
  enviados: number;
  abiertos: number;
  clicks: number;
  estado: 'borrador' | 'programada' | 'enviando' | 'enviada' | 'cancelada';
  fecha_programada?: string;
  fecha_enviada?: string;
  creado_por?: string;
  created_at: string;
  updated_at: string;
};

export type CampaignFormData = {
  nombre: string;
  asunto: string;
  plantillaId: string | null;
  contenidoHtml: string;
  destinatariosIds: string[];
  filtroEvento?: string;
  filtroEstado?: string;
};

export type AttendeeRecipient = {
  id: string;
  nombre: string;
  apellido?: string;
  email: string;
  evento_id?: string;
  evento_nombre?: string;
  codigo_ticket?: string;
  selected: boolean;
};

export type CampaignStats = {
  total: number;
  enviadas: number;
  borradores: number;
  programadas: number;
  tasaApertura: number;
};
