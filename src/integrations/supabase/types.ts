export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      asistentes: {
        Row: {
          apellido: string | null
          ciudad: string | null
          codigo_ticket: string
          comentarios: string | null
          como_se_entero: string | null
          created_at: string | null
          documento_identidad: string | null
          email: string
          estado: string | null
          evento_id: string | null
          fecha_check_in: string | null
          fecha_nacimiento: string | null
          fecha_registro: string | null
          genero: string | null
          id: string
          metadata: Json | null
          nombre: string
          telefono: string | null
          tipo_ticket_id: string | null
          updated_at: string | null
        }
        Insert: {
          apellido?: string | null
          ciudad?: string | null
          codigo_ticket: string
          comentarios?: string | null
          como_se_entero?: string | null
          created_at?: string | null
          documento_identidad?: string | null
          email: string
          estado?: string | null
          evento_id?: string | null
          fecha_check_in?: string | null
          fecha_nacimiento?: string | null
          fecha_registro?: string | null
          genero?: string | null
          id?: string
          metadata?: Json | null
          nombre: string
          telefono?: string | null
          tipo_ticket_id?: string | null
          updated_at?: string | null
        }
        Update: {
          apellido?: string | null
          ciudad?: string | null
          codigo_ticket?: string
          comentarios?: string | null
          como_se_entero?: string | null
          created_at?: string | null
          documento_identidad?: string | null
          email?: string
          estado?: string | null
          evento_id?: string | null
          fecha_check_in?: string | null
          fecha_nacimiento?: string | null
          fecha_registro?: string | null
          genero?: string | null
          id?: string
          metadata?: Json | null
          nombre?: string
          telefono?: string | null
          tipo_ticket_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asistentes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistentes_tipo_ticket_id_fkey"
            columns: ["tipo_ticket_id"]
            isOneToOne: false
            referencedRelation: "tipos_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      campanas_email: {
        Row: {
          abiertos: number | null
          asunto: string
          audiencia: string | null
          clicks: number | null
          configuracion_envio: Json | null
          contenido: string
          contenido_html: string | null
          creado_por: string | null
          created_at: string | null
          desuscritos: number | null
          enviados: number | null
          estado: string | null
          fecha_enviada: string | null
          fecha_programada: string | null
          filtros_audiencia: Json | null
          id: string
          nombre: string | null
          plantilla_id: string | null
          rebotes: number | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          abiertos?: number | null
          asunto: string
          audiencia?: string | null
          clicks?: number | null
          configuracion_envio?: Json | null
          contenido: string
          contenido_html?: string | null
          creado_por?: string | null
          created_at?: string | null
          desuscritos?: number | null
          enviados?: number | null
          estado?: string | null
          fecha_enviada?: string | null
          fecha_programada?: string | null
          filtros_audiencia?: Json | null
          id?: string
          nombre?: string | null
          plantilla_id?: string | null
          rebotes?: number | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          abiertos?: number | null
          asunto?: string
          audiencia?: string | null
          clicks?: number | null
          configuracion_envio?: Json | null
          contenido?: string
          contenido_html?: string | null
          creado_por?: string | null
          created_at?: string | null
          desuscritos?: number | null
          enviados?: number | null
          estado?: string | null
          fecha_enviada?: string | null
          fecha_programada?: string | null
          filtros_audiencia?: Json | null
          id?: string
          nombre?: string | null
          plantilla_id?: string | null
          rebotes?: number | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      canjes: {
        Row: {
          apellido_asistente: string | null
          asistente_id: string
          canjeado_tp: boolean | null
          cantidad: number | null
          correo: string | null
          created_at: string | null
          diferencia_precio: number | null
          email_error_enviado: boolean | null
          ERROR_TP: boolean | null
          estado: string | null
          evento_original_id: string
          evento_tp_id: string | null
          fecha_email_error: string | null
          fecha_procesado: string | null
          fecha_solicitud: string | null
          id: string
          invoice_id: string | null
          metodo_pago_diferencia: string | null
          motivo: string | null
          nombre_asistente: string | null
          notas_admin: string | null
          procesado_por: string | null
          response_tp: string | null
          ticket_ids: string[] | null
          ticket_tp_id: string | null
          tipo_ticket_original_id: string
          updated_at: string | null
        }
        Insert: {
          apellido_asistente?: string | null
          asistente_id: string
          canjeado_tp?: boolean | null
          cantidad?: number | null
          correo?: string | null
          created_at?: string | null
          diferencia_precio?: number | null
          email_error_enviado?: boolean | null
          ERROR_TP?: boolean | null
          estado?: string | null
          evento_original_id: string
          evento_tp_id?: string | null
          fecha_email_error?: string | null
          fecha_procesado?: string | null
          fecha_solicitud?: string | null
          id?: string
          invoice_id?: string | null
          metodo_pago_diferencia?: string | null
          motivo?: string | null
          nombre_asistente?: string | null
          notas_admin?: string | null
          procesado_por?: string | null
          response_tp?: string | null
          ticket_ids?: string[] | null
          ticket_tp_id?: string | null
          tipo_ticket_original_id: string
          updated_at?: string | null
        }
        Update: {
          apellido_asistente?: string | null
          asistente_id?: string
          canjeado_tp?: boolean | null
          cantidad?: number | null
          correo?: string | null
          created_at?: string | null
          diferencia_precio?: number | null
          email_error_enviado?: boolean | null
          ERROR_TP?: boolean | null
          estado?: string | null
          evento_original_id?: string
          evento_tp_id?: string | null
          fecha_email_error?: string | null
          fecha_procesado?: string | null
          fecha_solicitud?: string | null
          id?: string
          invoice_id?: string | null
          metodo_pago_diferencia?: string | null
          motivo?: string | null
          nombre_asistente?: string | null
          notas_admin?: string | null
          procesado_por?: string | null
          response_tp?: string | null
          ticket_ids?: string[] | null
          ticket_tp_id?: string | null
          tipo_ticket_original_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canjes_asistente_id_fkey"
            columns: ["asistente_id"]
            isOneToOne: false
            referencedRelation: "asistentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canjes_evento_original_id_fkey"
            columns: ["evento_original_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canjes_procesado_por_fkey"
            columns: ["procesado_por"]
            isOneToOne: false
            referencedRelation: "usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canjes_tipo_ticket_original_id_fkey"
            columns: ["tipo_ticket_original_id"]
            isOneToOne: false
            referencedRelation: "tipos_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      configuraciones_sistema: {
        Row: {
          actualizado_por: string | null
          categoria: string | null
          clave: string
          created_at: string | null
          descripcion: string | null
          es_publica: boolean | null
          es_requerida: boolean | null
          id: string
          opciones_permitidas: string[] | null
          tipo_dato: string | null
          updated_at: string | null
          validacion_regex: string | null
          valor: string | null
          valor_por_defecto: string | null
        }
        Insert: {
          actualizado_por?: string | null
          categoria?: string | null
          clave: string
          created_at?: string | null
          descripcion?: string | null
          es_publica?: boolean | null
          es_requerida?: boolean | null
          id?: string
          opciones_permitidas?: string[] | null
          tipo_dato?: string | null
          updated_at?: string | null
          validacion_regex?: string | null
          valor?: string | null
          valor_por_defecto?: string | null
        }
        Update: {
          actualizado_por?: string | null
          categoria?: string | null
          clave?: string
          created_at?: string | null
          descripcion?: string | null
          es_publica?: boolean | null
          es_requerida?: boolean | null
          id?: string
          opciones_permitidas?: string[] | null
          tipo_dato?: string | null
          updated_at?: string | null
          validacion_regex?: string | null
          valor?: string | null
          valor_por_defecto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuraciones_sistema_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          categoria: string | null
          certificado_disponible: boolean | null
          creado_por: string
          created_at: string | null
          descripcion: string | null
          descripcion_corta: string | null
          duracion_estimada_horas: number | null
          estado: string | null
          id: string
          imagen_portada_url: string | null
          instructor_id: string | null
          nivel: string | null
          objetivos: string[] | null
          orden_visualizacion: number | null
          precio: number | null
          requisitos: string[] | null
          titulo: string
          updated_at: string | null
          video_trailer_url: string | null
        }
        Insert: {
          categoria?: string | null
          certificado_disponible?: boolean | null
          creado_por: string
          created_at?: string | null
          descripcion?: string | null
          descripcion_corta?: string | null
          duracion_estimada_horas?: number | null
          estado?: string | null
          id?: string
          imagen_portada_url?: string | null
          instructor_id?: string | null
          nivel?: string | null
          objetivos?: string[] | null
          orden_visualizacion?: number | null
          precio?: number | null
          requisitos?: string[] | null
          titulo: string
          updated_at?: string | null
          video_trailer_url?: string | null
        }
        Update: {
          categoria?: string | null
          certificado_disponible?: boolean | null
          creado_por?: string
          created_at?: string | null
          descripcion?: string | null
          descripcion_corta?: string | null
          duracion_estimada_horas?: number | null
          estado?: string | null
          id?: string
          imagen_portada_url?: string | null
          instructor_id?: string | null
          nivel?: string | null
          objetivos?: string[] | null
          orden_visualizacion?: number | null
          precio?: number | null
          requisitos?: string[] | null
          titulo?: string
          updated_at?: string | null
          video_trailer_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cursos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      envios_email: {
        Row: {
          campana_id: string
          created_at: string | null
          email_destinatario: string
          enlaces_clickeados: string[] | null
          estado: string | null
          fecha_apertura: string | null
          fecha_click: string | null
          fecha_entrega: string | null
          fecha_envio: string | null
          fecha_rebote: string | null
          id: string
          ip_apertura: unknown | null
          metadata: Json | null
          motivo_rebote: string | null
          numero_aperturas: number | null
          numero_clicks: number | null
          suscriptor_id: string | null
          user_agent_apertura: string | null
        }
        Insert: {
          campana_id: string
          created_at?: string | null
          email_destinatario: string
          enlaces_clickeados?: string[] | null
          estado?: string | null
          fecha_apertura?: string | null
          fecha_click?: string | null
          fecha_entrega?: string | null
          fecha_envio?: string | null
          fecha_rebote?: string | null
          id?: string
          ip_apertura?: unknown | null
          metadata?: Json | null
          motivo_rebote?: string | null
          numero_aperturas?: number | null
          numero_clicks?: number | null
          suscriptor_id?: string | null
          user_agent_apertura?: string | null
        }
        Update: {
          campana_id?: string
          created_at?: string | null
          email_destinatario?: string
          enlaces_clickeados?: string[] | null
          estado?: string | null
          fecha_apertura?: string | null
          fecha_click?: string | null
          fecha_entrega?: string | null
          fecha_envio?: string | null
          fecha_rebote?: string | null
          id?: string
          ip_apertura?: unknown | null
          metadata?: Json | null
          motivo_rebote?: string | null
          numero_aperturas?: number | null
          numero_clicks?: number | null
          suscriptor_id?: string | null
          user_agent_apertura?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "envios_email_campana_id_fkey"
            columns: ["campana_id"]
            isOneToOne: false
            referencedRelation: "campanas_email"
            referencedColumns: ["id"]
          },
        ]
      }
      estudiantes_cursos: {
        Row: {
          certificado_emitido: boolean | null
          created_at: string | null
          curso_id: string
          email_estudiante: string
          estado: string | null
          fecha_certificado: string | null
          fecha_completado: string | null
          fecha_inscripcion: string | null
          id: string
          lecciones_completadas: number | null
          metodo_pago: string | null
          monto_pagado: number | null
          nombre_estudiante: string
          notas_instructor: string | null
          progreso: number | null
          puntuacion_promedio: number | null
          telefono_estudiante: string | null
          tiempo_total_minutos: number | null
          ultima_actividad: string | null
          updated_at: string | null
        }
        Insert: {
          certificado_emitido?: boolean | null
          created_at?: string | null
          curso_id: string
          email_estudiante: string
          estado?: string | null
          fecha_certificado?: string | null
          fecha_completado?: string | null
          fecha_inscripcion?: string | null
          id?: string
          lecciones_completadas?: number | null
          metodo_pago?: string | null
          monto_pagado?: number | null
          nombre_estudiante: string
          notas_instructor?: string | null
          progreso?: number | null
          puntuacion_promedio?: number | null
          telefono_estudiante?: string | null
          tiempo_total_minutos?: number | null
          ultima_actividad?: string | null
          updated_at?: string | null
        }
        Update: {
          certificado_emitido?: boolean | null
          created_at?: string | null
          curso_id?: string
          email_estudiante?: string
          estado?: string | null
          fecha_certificado?: string | null
          fecha_completado?: string | null
          fecha_inscripcion?: string | null
          id?: string
          lecciones_completadas?: number | null
          metodo_pago?: string | null
          monto_pagado?: number | null
          nombre_estudiante?: string
          notas_instructor?: string | null
          progreso?: number | null
          puntuacion_promedio?: number | null
          telefono_estudiante?: string | null
          tiempo_total_minutos?: number | null
          ultima_actividad?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estudiantes_cursos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          canjes_habilitados: boolean | null
          created_at: string | null
          descripcion: string | null
          estado: string | null
          fecha: string
          genero_musical: string | null
          id: string
          imagen_url: string | null
          lugar: string
          nombre: string
          precio: number
          tp_id: string | null
          updated_at: string | null
          vendidos: number | null
        }
        Insert: {
          canjes_habilitados?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha: string
          genero_musical?: string | null
          id?: string
          imagen_url?: string | null
          lugar: string
          nombre: string
          precio: number
          tp_id?: string | null
          updated_at?: string | null
          vendidos?: number | null
        }
        Update: {
          canjes_habilitados?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha?: string
          genero_musical?: string | null
          id?: string
          imagen_url?: string | null
          lugar?: string
          nombre?: string
          precio?: number
          tp_id?: string | null
          updated_at?: string | null
          vendidos?: number | null
        }
        Relationships: []
      }
      eventos_analytics: {
        Row: {
          asistente_id: string | null
          ciudad: string | null
          created_at: string | null
          dispositivo: string | null
          entidad_id: string | null
          entidad_tipo: string | null
          id: string
          ip_address: unknown | null
          navegador: string | null
          pais: string | null
          propiedades: Json | null
          referrer: string | null
          sistema_operativo: string | null
          tipo_evento: string
          user_agent: string | null
          usuario_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          valor_numerico: number | null
        }
        Insert: {
          asistente_id?: string | null
          ciudad?: string | null
          created_at?: string | null
          dispositivo?: string | null
          entidad_id?: string | null
          entidad_tipo?: string | null
          id?: string
          ip_address?: unknown | null
          navegador?: string | null
          pais?: string | null
          propiedades?: Json | null
          referrer?: string | null
          sistema_operativo?: string | null
          tipo_evento: string
          user_agent?: string | null
          usuario_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_numerico?: number | null
        }
        Update: {
          asistente_id?: string | null
          ciudad?: string | null
          created_at?: string | null
          dispositivo?: string | null
          entidad_id?: string | null
          entidad_tipo?: string | null
          id?: string
          ip_address?: unknown | null
          navegador?: string | null
          pais?: string | null
          propiedades?: Json | null
          referrer?: string | null
          sistema_operativo?: string | null
          tipo_evento?: string
          user_agent?: string | null
          usuario_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_numerico?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_analytics_asistente_id_fkey"
            columns: ["asistente_id"]
            isOneToOne: false
            referencedRelation: "asistentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_analytics_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      importaciones_queue: {
        Row: {
          archivo_nombre: string
          archivo_size: number | null
          archivo_url: string | null
          batch_id: string | null
          campos_detectados: Json | null
          chunk_numero: number
          chunk_total: number
          created_at: string | null
          duracion_segundos: number | null
          errores: Json | null
          estado: string | null
          genero_musical_detectado: string | null
          id: string
          progreso_porcentaje: number | null
          registros_actualizados: number | null
          registros_con_errores: number | null
          registros_fin: number
          registros_inicio: number
          registros_nuevos: number | null
          registros_procesados: number | null
          tiempo_fin: string | null
          tiempo_inicio: string | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          archivo_nombre: string
          archivo_size?: number | null
          archivo_url?: string | null
          batch_id?: string | null
          campos_detectados?: Json | null
          chunk_numero: number
          chunk_total: number
          created_at?: string | null
          duracion_segundos?: number | null
          errores?: Json | null
          estado?: string | null
          genero_musical_detectado?: string | null
          id?: string
          progreso_porcentaje?: number | null
          registros_actualizados?: number | null
          registros_con_errores?: number | null
          registros_fin: number
          registros_inicio: number
          registros_nuevos?: number | null
          registros_procesados?: number | null
          tiempo_fin?: string | null
          tiempo_inicio?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          archivo_nombre?: string
          archivo_size?: number | null
          archivo_url?: string | null
          batch_id?: string | null
          campos_detectados?: Json | null
          chunk_numero?: number
          chunk_total?: number
          created_at?: string | null
          duracion_segundos?: number | null
          errores?: Json | null
          estado?: string | null
          genero_musical_detectado?: string | null
          id?: string
          progreso_porcentaje?: number | null
          registros_actualizados?: number | null
          registros_con_errores?: number | null
          registros_fin?: number
          registros_inicio?: number
          registros_nuevos?: number | null
          registros_procesados?: number | null
          tiempo_fin?: string | null
          tiempo_inicio?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      lecciones_cursos: {
        Row: {
          audio_url: string | null
          configuracion: Json | null
          contenido: string | null
          created_at: string | null
          curso_id: string
          descripcion: string | null
          duracion_minutos: number | null
          es_gratuita: boolean | null
          es_obligatoria: boolean | null
          id: string
          orden: number
          puntuacion_minima: number | null
          recursos_adjuntos: Json | null
          tipo: string | null
          titulo: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          configuracion?: Json | null
          contenido?: string | null
          created_at?: string | null
          curso_id: string
          descripcion?: string | null
          duracion_minutos?: number | null
          es_gratuita?: boolean | null
          es_obligatoria?: boolean | null
          id?: string
          orden: number
          puntuacion_minima?: number | null
          recursos_adjuntos?: Json | null
          tipo?: string | null
          titulo: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          configuracion?: Json | null
          contenido?: string | null
          created_at?: string | null
          curso_id?: string
          descripcion?: string | null
          duracion_minutos?: number | null
          es_gratuita?: boolean | null
          es_obligatoria?: boolean | null
          id?: string
          orden?: number
          puntuacion_minima?: number | null
          recursos_adjuntos?: Json | null
          tipo?: string | null
          titulo?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lecciones_cursos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_auditoria: {
        Row: {
          accion: string
          created_at: string | null
          duracion_ms: number | null
          entidad_id: string | null
          entidad_tipo: string
          id: string
          ip_address: unknown | null
          mensaje_error: string | null
          metadata: Json | null
          resultado: string | null
          sesion_id: string | null
          user_agent: string | null
          usuario_id: string | null
          valores_anteriores: Json | null
          valores_nuevos: Json | null
        }
        Insert: {
          accion: string
          created_at?: string | null
          duracion_ms?: number | null
          entidad_id?: string | null
          entidad_tipo: string
          id?: string
          ip_address?: unknown | null
          mensaje_error?: string | null
          metadata?: Json | null
          resultado?: string | null
          sesion_id?: string | null
          user_agent?: string | null
          usuario_id?: string | null
          valores_anteriores?: Json | null
          valores_nuevos?: Json | null
        }
        Update: {
          accion?: string
          created_at?: string | null
          duracion_ms?: number | null
          entidad_id?: string | null
          entidad_tipo?: string
          id?: string
          ip_address?: unknown | null
          mensaje_error?: string | null
          metadata?: Json | null
          resultado?: string | null
          sesion_id?: string | null
          user_agent?: string | null
          usuario_id?: string | null
          valores_anteriores?: Json | null
          valores_nuevos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_notificaciones_canje: {
        Row: {
          canje_id: string | null
          created_at: string | null
          email_enviado_a: string | null
          error_mensaje: string | null
          estado: string | null
          id: string
        }
        Insert: {
          canje_id?: string | null
          created_at?: string | null
          email_enviado_a?: string | null
          error_mensaje?: string | null
          estado?: string | null
          id?: string
        }
        Update: {
          canje_id?: string | null
          created_at?: string | null
          email_enviado_a?: string | null
          error_mensaje?: string | null
          estado?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_notificaciones_canje_canje_id_fkey"
            columns: ["canje_id"]
            isOneToOne: false
            referencedRelation: "canjes"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          asistente_id: string | null
          codigo_cupon: string | null
          comision: number | null
          created_at: string | null
          datos_pasarela: Json | null
          descuento: number | null
          estado: string | null
          evento_id: string
          fecha_pago: string | null
          fecha_vencimiento: string | null
          id: string
          impuestos: number | null
          ip_pago: unknown | null
          metodo_pago: string
          moneda: string | null
          monto: number
          monto_total: number | null
          notas: string | null
          referencia_externa: string | null
          referencia_pasarela: string | null
          tipo_ticket_id: string
          updated_at: string | null
        }
        Insert: {
          asistente_id?: string | null
          codigo_cupon?: string | null
          comision?: number | null
          created_at?: string | null
          datos_pasarela?: Json | null
          descuento?: number | null
          estado?: string | null
          evento_id: string
          fecha_pago?: string | null
          fecha_vencimiento?: string | null
          id?: string
          impuestos?: number | null
          ip_pago?: unknown | null
          metodo_pago: string
          moneda?: string | null
          monto: number
          monto_total?: number | null
          notas?: string | null
          referencia_externa?: string | null
          referencia_pasarela?: string | null
          tipo_ticket_id: string
          updated_at?: string | null
        }
        Update: {
          asistente_id?: string | null
          codigo_cupon?: string | null
          comision?: number | null
          created_at?: string | null
          datos_pasarela?: Json | null
          descuento?: number | null
          estado?: string | null
          evento_id?: string
          fecha_pago?: string | null
          fecha_vencimiento?: string | null
          id?: string
          impuestos?: number | null
          ip_pago?: unknown | null
          metodo_pago?: string
          moneda?: string | null
          monto?: number
          monto_total?: number | null
          notas?: string | null
          referencia_externa?: string | null
          referencia_pasarela?: string | null
          tipo_ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_asistente_id_fkey"
            columns: ["asistente_id"]
            isOneToOne: false
            referencedRelation: "asistentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_tipo_ticket_id_fkey"
            columns: ["tipo_ticket_id"]
            isOneToOne: false
            referencedRelation: "tipos_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      plantillas_email: {
        Row: {
          activa: boolean | null
          asunto_predeterminado: string | null
          categoria: string | null
          contenido_html: string
          contenido_texto: string | null
          created_at: string | null
          descripcion: string | null
          es_predeterminada: boolean | null
          id: string
          nombre: string
          updated_at: string | null
          usuario_creador: string | null
          variables_disponibles: Json | null
        }
        Insert: {
          activa?: boolean | null
          asunto_predeterminado?: string | null
          categoria?: string | null
          contenido_html: string
          contenido_texto?: string | null
          created_at?: string | null
          descripcion?: string | null
          es_predeterminada?: boolean | null
          id?: string
          nombre: string
          updated_at?: string | null
          usuario_creador?: string | null
          variables_disponibles?: Json | null
        }
        Update: {
          activa?: boolean | null
          asunto_predeterminado?: string | null
          categoria?: string | null
          contenido_html?: string
          contenido_texto?: string | null
          created_at?: string | null
          descripcion?: string | null
          es_predeterminada?: boolean | null
          id?: string
          nombre?: string
          updated_at?: string | null
          usuario_creador?: string | null
          variables_disponibles?: Json | null
        }
        Relationships: []
      }
      progreso_lecciones: {
        Row: {
          created_at: string | null
          estado: string | null
          estudiante_curso_id: string
          fecha_completado: string | null
          fecha_inicio: string | null
          id: string
          intentos: number | null
          leccion_id: string
          notas_estudiante: string | null
          progreso_porcentaje: number | null
          puntuacion: number | null
          respuestas_quiz: Json | null
          tiempo_visto_minutos: number | null
          ultima_posicion_video: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          estudiante_curso_id: string
          fecha_completado?: string | null
          fecha_inicio?: string | null
          id?: string
          intentos?: number | null
          leccion_id: string
          notas_estudiante?: string | null
          progreso_porcentaje?: number | null
          puntuacion?: number | null
          respuestas_quiz?: Json | null
          tiempo_visto_minutos?: number | null
          ultima_posicion_video?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          estudiante_curso_id?: string
          fecha_completado?: string | null
          fecha_inicio?: string | null
          id?: string
          intentos?: number | null
          leccion_id?: string
          notas_estudiante?: string | null
          progreso_porcentaje?: number | null
          puntuacion?: number | null
          respuestas_quiz?: Json | null
          tiempo_visto_minutos?: number | null
          ultima_posicion_video?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progreso_lecciones_estudiante_curso_id_fkey"
            columns: ["estudiante_curso_id"]
            isOneToOne: false
            referencedRelation: "estudiantes_cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progreso_lecciones_leccion_id_fkey"
            columns: ["leccion_id"]
            isOneToOne: false
            referencedRelation: "lecciones_cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      reembolsos: {
        Row: {
          asistente_id: string
          comision: number | null
          created_at: string | null
          documentos_adjuntos: string[] | null
          estado: string | null
          evento_id: string
          fecha_procesado: string | null
          fecha_solicitud: string | null
          id: string
          metodo_reembolso: string | null
          monto: number
          monto_neto: number | null
          motivo: string
          notas_admin: string | null
          procesado_por: string | null
          referencia_pago: string | null
          tipo_ticket_id: string
          tp_id: string | null
          updated_at: string | null
        }
        Insert: {
          asistente_id: string
          comision?: number | null
          created_at?: string | null
          documentos_adjuntos?: string[] | null
          estado?: string | null
          evento_id: string
          fecha_procesado?: string | null
          fecha_solicitud?: string | null
          id?: string
          metodo_reembolso?: string | null
          monto: number
          monto_neto?: number | null
          motivo: string
          notas_admin?: string | null
          procesado_por?: string | null
          referencia_pago?: string | null
          tipo_ticket_id: string
          tp_id?: string | null
          updated_at?: string | null
        }
        Update: {
          asistente_id?: string
          comision?: number | null
          created_at?: string | null
          documentos_adjuntos?: string[] | null
          estado?: string | null
          evento_id?: string
          fecha_procesado?: string | null
          fecha_solicitud?: string | null
          id?: string
          metodo_reembolso?: string | null
          monto?: number
          monto_neto?: number | null
          motivo?: string
          notas_admin?: string | null
          procesado_por?: string | null
          referencia_pago?: string | null
          tipo_ticket_id?: string
          tp_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reembolsos_asistente_id_fkey"
            columns: ["asistente_id"]
            isOneToOne: false
            referencedRelation: "asistentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reembolsos_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reembolsos_procesado_por_fkey"
            columns: ["procesado_por"]
            isOneToOne: false
            referencedRelation: "usuarios_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reembolsos_tipo_ticket_id_fkey"
            columns: ["tipo_ticket_id"]
            isOneToOne: false
            referencedRelation: "tipos_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      suscriptores_email: {
        Row: {
          confirmado: boolean | null
          created_at: string | null
          email: string
          estado: string | null
          fecha_desuscripcion: string | null
          fecha_suscripcion: string | null
          fuente: string | null
          id: string
          ip_suscripcion: unknown | null
          nombre: string | null
          preferencias: Json | null
          tags: string[] | null
          telefono: string | null
          token_confirmacion: string | null
          updated_at: string | null
          user_agent_suscripcion: string | null
        }
        Insert: {
          confirmado?: boolean | null
          created_at?: string | null
          email: string
          estado?: string | null
          fecha_desuscripcion?: string | null
          fecha_suscripcion?: string | null
          fuente?: string | null
          id?: string
          ip_suscripcion?: unknown | null
          nombre?: string | null
          preferencias?: Json | null
          tags?: string[] | null
          telefono?: string | null
          token_confirmacion?: string | null
          updated_at?: string | null
          user_agent_suscripcion?: string | null
        }
        Update: {
          confirmado?: boolean | null
          created_at?: string | null
          email?: string
          estado?: string | null
          fecha_desuscripcion?: string | null
          fecha_suscripcion?: string | null
          fuente?: string | null
          id?: string
          ip_suscripcion?: unknown | null
          nombre?: string | null
          preferencias?: Json | null
          tags?: string[] | null
          telefono?: string | null
          token_confirmacion?: string | null
          updated_at?: string | null
          user_agent_suscripcion?: string | null
        }
        Relationships: []
      }
      tipos_tickets: {
        Row: {
          activo: boolean | null
          beneficios: string[] | null
          capacidad: number
          color: string | null
          created_at: string | null
          descripcion: string | null
          evento_id: string | null
          id: string
          maximo_canjes: number | null
          precio: number
          tipo: string
          tp_id: string | null
          updated_at: string | null
          vendidos: number | null
        }
        Insert: {
          activo?: boolean | null
          beneficios?: string[] | null
          capacidad: number
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          evento_id?: string | null
          id?: string
          maximo_canjes?: number | null
          precio: number
          tipo: string
          tp_id?: string | null
          updated_at?: string | null
          vendidos?: number | null
        }
        Update: {
          activo?: boolean | null
          beneficios?: string[] | null
          capacidad?: number
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          evento_id?: string | null
          id?: string
          maximo_canjes?: number | null
          precio?: number
          tipo?: string
          tp_id?: string | null
          updated_at?: string | null
          vendidos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tipos_tickets_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios_sistema: {
        Row: {
          avatar_url: string | null
          configuraciones: Json | null
          created_at: string | null
          email: string
          estado: string | null
          id: string
          nombre: string
          password_hash: string
          rol: string | null
          telefono: string | null
          ultimo_login: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          configuraciones?: Json | null
          created_at?: string | null
          email: string
          estado?: string | null
          id?: string
          nombre: string
          password_hash: string
          rol?: string | null
          telefono?: string | null
          ultimo_login?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          configuraciones?: Json | null
          created_at?: string | null
          email?: string
          estado?: string | null
          id?: string
          nombre?: string
          password_hash?: string
          rol?: string | null
          telefono?: string | null
          ultimo_login?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      validaciones_bd: {
        Row: {
          activa: boolean | null
          consulta_sql: string
          creado_por: string | null
          created_at: string | null
          descripcion: string
          detalles_resultado: Json | null
          duracion_segundos: number | null
          emails_notificacion: string[] | null
          estado: string | null
          frecuencia_horas: number | null
          historial_ejecuciones: Json | null
          id: string
          nombre: string
          notificaciones_habilitadas: boolean | null
          problemas_encontrados: number | null
          proxima_ejecucion: string | null
          tipo: string | null
          ultima_ejecucion: string | null
          umbral_advertencia: number | null
          umbral_error: number | null
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          consulta_sql: string
          creado_por?: string | null
          created_at?: string | null
          descripcion: string
          detalles_resultado?: Json | null
          duracion_segundos?: number | null
          emails_notificacion?: string[] | null
          estado?: string | null
          frecuencia_horas?: number | null
          historial_ejecuciones?: Json | null
          id?: string
          nombre: string
          notificaciones_habilitadas?: boolean | null
          problemas_encontrados?: number | null
          proxima_ejecucion?: string | null
          tipo?: string | null
          ultima_ejecucion?: string | null
          umbral_advertencia?: number | null
          umbral_error?: number | null
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          consulta_sql?: string
          creado_por?: string | null
          created_at?: string | null
          descripcion?: string
          detalles_resultado?: Json | null
          duracion_segundos?: number | null
          emails_notificacion?: string[] | null
          estado?: string | null
          frecuencia_horas?: number | null
          historial_ejecuciones?: Json | null
          id?: string
          nombre?: string
          notificaciones_habilitadas?: boolean | null
          problemas_encontrados?: number | null
          proxima_ejecucion?: string | null
          tipo?: string | null
          ultima_ejecucion?: string | null
          umbral_advertencia?: number | null
          umbral_error?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "validaciones_bd_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vista_estadisticas_asistentes: {
        Row: {
          asistentes_cancelados: number | null
          asistentes_check_in: number | null
          asistentes_confirmados: number | null
          asistentes_pendientes: number | null
          emails_unicos: number | null
          total_asistentes: number | null
        }
        Relationships: []
      }
      vista_estadisticas_canjes: {
        Row: {
          canjes_aprobados: number | null
          canjes_completados: number | null
          canjes_pendientes: number | null
          canjes_rechazados: number | null
          tiempo_promedio_procesamiento_horas: number | null
          total_canjes: number | null
        }
        Relationships: []
      }
      vista_estadisticas_reembolsos: {
        Row: {
          monto_promedio_reembolso: number | null
          monto_total_reembolsado: number | null
          reembolsos_aprobados: number | null
          reembolsos_pendientes: number | null
          reembolsos_procesados: number | null
          total_reembolsos: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      actualizar_estadisticas_evento: {
        Args: { evento_id: string }
        Returns: undefined
      }
      calcular_progreso_curso: {
        Args: { estudiante_curso_id: string }
        Returns: number
      }
      execute_readonly_query: {
        Args: { query_text: string }
        Returns: Json
      }
      generar_codigo_ticket: {
        Args: { evento_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_by_email: {
        Args: { user_email: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
