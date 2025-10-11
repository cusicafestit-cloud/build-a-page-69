export type ValidacionBD = {
  id: string;
  nombre: string;
  descripcion: string;
  consulta_sql: string;
  tipo: 'integridad' | 'consistencia' | 'seguridad';
  estado: 'pendiente' | 'ejecutando' | 'completado' | 'fallido';
  activa: boolean;
  frecuencia_horas: number;
  ultima_ejecucion: string | null;
  proxima_ejecucion: string | null;
  duracion_segundos: number;
  problemas_encontrados: number;
  detalles_resultado: any;
  umbral_advertencia: number;
  umbral_error: number;
  creado_por: string | null;
  created_at: string;
  updated_at: string;
};

export type ValidationHealthStatus = {
  total: number;
  passed: number;
  warnings: number;
  errors: number;
  lastExecution: string | null;
  averageDuration: number;
  healthPercentage: number;
};

export type ValidationExecutionResult = {
  success: boolean;
  duration: number;
  problemsFound: number;
  details: any;
  error?: string;
};
