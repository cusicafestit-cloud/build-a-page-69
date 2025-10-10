export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      importaciones_queue: {
        Row: {
          id: string
          archivo_nombre: string
          archivo_url: string
          archivo_size: number
          chunk_numero: number
          chunk_total: number
          registros_inicio: number
          registros_fin: number
          batch_id: string
          estado: string
          progreso_porcentaje: number
          registros_procesados: number
          registros_nuevos: number
          registros_actualizados: number
          registros_con_errores: number
          errores_detalle: Json
          genero_musical_detectado: string | null
          duracion_segundos: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          archivo_nombre: string
          archivo_url: string
          archivo_size: number
          chunk_numero: number
          chunk_total: number
          registros_inicio: number
          registros_fin: number
          batch_id: string
          estado?: string
          progreso_porcentaje?: number
          registros_procesados?: number
          registros_nuevos?: number
          registros_actualizados?: number
          registros_con_errores?: number
          errores_detalle?: Json
          genero_musical_detectado?: string | null
          duracion_segundos?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          archivo_nombre?: string
          archivo_url?: string
          archivo_size?: number
          chunk_numero?: number
          chunk_total?: number
          registros_inicio?: number
          registros_fin?: number
          batch_id?: string
          estado?: string
          progreso_porcentaje?: number
          registros_procesados?: number
          registros_nuevos?: number
          registros_actualizados?: number
          registros_con_errores?: number
          errores_detalle?: Json
          genero_musical_detectado?: string | null
          duracion_segundos?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
  }
}
