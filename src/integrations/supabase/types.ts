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
          ciudad: string | null
          codigo_ticket: string
          comentarios: string | null
          como_se_entero: string | null
          created_at: string | null
          documento_identidad: string | null
          email: string
          estado: string | null
          evento_id: string
          fecha_check_in: string | null
          fecha_nacimiento: string | null
          fecha_registro: string | null
          genero: string | null
          id: string
          metadata: Json | null
          nombre: string
          telefono: string | null
          tipo_ticket_id: string
          updated_at: string | null
        }
        Insert: {
          ciudad?: string | null
          codigo_ticket: string
          comentarios?: string | null
          como_se_entero?: string | null
          created_at?: string | null
          documento_identidad?: string | null
          email: string
          estado?: string | null
          evento_id: string
          fecha_check_in?: string | null
          fecha_nacimiento?: string | null
          fecha_registro?: string | null
          genero?: string | null
          id?: string
          metadata?: Json | null
          nombre: string
          telefono?: string | null
          tipo_ticket_id: string
          updated_at?: string | null
        }
        Update: {
          ciudad?: string | null
          codigo_ticket?: string
          comentarios?: string | null
          como_se_entero?: string | null
          created_at?: string | null
          documento_identidad?: string | null
          email?: string
          estado?: string | null
          evento_id?: string
          fecha_check_in?: string | null
          fecha_nacimiento?: string | null
          fecha_registro?: string | null
          genero?: string | null
          id?: string
          metadata?: Json | null
          nombre?: string
          telefono?: string | null
          tipo_ticket_id?: string
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
      canjes: {
        Row: {
          apellido_asistente: string | null
          asistente_id: string
          cantidad: number | null
          created_at: string | null
          diferencia_precio: number | null
          estado: string | null
          evento_destino_id: string
          evento_original_id: string
          evento_tp_id: string | null
          fecha_procesado: string | null
          fecha_solicitud: string | null
          id: string
          metodo_pago_diferencia: string | null
          motivo: string | null
          nombre_asistente: string | null
          notas_admin: string | null
          procesado_por: string | null
          ticket_tp_id: string | null
          tipo_ticket_destino_id: string
          tipo_ticket_original_id: string
          updated_at: string | null
        }
        Insert: {
          apellido_asistente?: string | null
          asistente_id: string
          cantidad?: number | null
          created_at?: string | null
          diferencia_precio?: number | null
          estado?: string | null
          evento_destino_id: string
          evento_original_id: string
          evento_tp_id?: string | null
          fecha_procesado?: string | null
          fecha_solicitud?: string | null
          id?: string
          metodo_pago_diferencia?: string | null
          motivo?: string | null
          nombre_asistente?: string | null
          notas_admin?: string | null
          procesado_por?: string | null
          ticket_tp_id?: string | null
          tipo_ticket_destino_id: string
          tipo_ticket_original_id: string
          updated_at?: string | null
        }
        Update: {
          apellido_asistente?: string | null
          asistente_id?: string
          cantidad?: number | null
          created_at?: string | null
          diferencia_precio?: number | null
          estado?: string | null
          evento_destino_id?: string
          evento_original_id?: string
          evento_tp_id?: string | null
          fecha_procesado?: string | null
          fecha_solicitud?: string | null
          id?: string
          metodo_pago_diferencia?: string | null
          motivo?: string | null
          nombre_asistente?: string | null
          notas_admin?: string | null
          procesado_por?: string | null
          ticket_tp_id?: string | null
          tipo_ticket_destino_id?: string
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
            foreignKeyName: "canjes_evento_destino_id_fkey"
            columns: ["evento_destino_id"]
            isOneToOne: false
            referencedRelation: "eventos"
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
            foreignKeyName: "canjes_tipo_ticket_destino_id_fkey"
            columns: ["tipo_ticket_destino_id"]
            isOneToOne: false
            referencedRelation: "tipos_tickets"
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
      eventos: {
        Row: {
          capacidad: number | null
          categoria: string | null
          created_at: string | null
          descripcion: string | null
          estado: string | null
          fecha: string
          id: string
          imagen_url: string | null
          metadata: Json | null
          nombre: string
          precio_base: number | null
          tp_id: string | null
          ubicacion: string | null
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          capacidad?: number | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha: string
          id?: string
          imagen_url?: string | null
          metadata?: Json | null
          nombre: string
          precio_base?: number | null
          tp_id?: string | null
          ubicacion?: string | null
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          capacidad?: number | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha?: string
          id?: string
          imagen_url?: string | null
          metadata?: Json | null
          nombre?: string
          precio_base?: number | null
          tp_id?: string | null
          ubicacion?: string | null
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      tipos_tickets: {
        Row: {
          color: string | null
          created_at: string | null
          descripcion: string | null
          evento_id: string | null
          id: string
          maximo_canjes: number | null
          tipo: string
          precio: number | null
          tp_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          evento_id?: string | null
          id?: string
          maximo_canjes?: number | null
          tipo: string
          precio?: number | null
          tp_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          evento_id?: string | null
          id?: string
          maximo_canjes?: number | null
          tipo?: string
          precio?: number | null
          tp_id?: string | null
          updated_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
