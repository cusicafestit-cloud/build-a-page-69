# Edge Function: process-import-chunk

## Descripción
Procesa chunks de importación de asistentes desde archivos Excel/CSV de forma asíncrona.

## Características
- ✅ Procesa hasta 1000 registros por ejecución
- ✅ Timeout preventivo a los 50 segundos (límite de 60s)
- ✅ Mapeo automático de columnas fuzzy
- ✅ Detección de género musical por artista (40+ artistas)
- ✅ UPSERT inteligente: actualiza solo campos vacíos
- ✅ Manejo robusto de errores por registro

## Despliegue

### 1. Verificar configuración de Supabase CLI
```bash
# Verificar login
supabase status

# Si no estás logueado:
supabase login
```

### 2. Link con tu proyecto
```bash
# En la raíz del proyecto
supabase link --project-ref zhvfoyglmdhsmavzbevc
```

### 3. Desplegar la función
```bash
supabase functions deploy process-import-chunk
```

### 4. Verificar despliegue
```bash
# Ver logs de la función
supabase functions logs process-import-chunk
```

## Variables de Entorno
La función usa automáticamente:
- `SUPABASE_URL`: URL de tu proyecto
- `SUPABASE_SERVICE_ROLE_KEY`: Key con permisos completos

## Uso desde el Frontend

```typescript
const { data, error } = await supabase.functions.invoke('process-import-chunk', {
  body: { 
    queueId: 'uuid-del-trabajo-en-cola'
  }
});
```

## Parámetros de Entrada

```typescript
{
  queueId: string  // ID del trabajo en la tabla importaciones_queue
}
```

## Respuesta Exitosa

```typescript
{
  success: true,
  procesados: 850,        // Registros procesados
  nuevos: 500,            // Nuevos registros creados
  actualizados: 350,      // Registros actualizados
  errores: 0,             // Registros con errores
  duracion: 42,           // Duración en segundos
  genero_musical: "Rock/Indie"
}
```

## Respuesta con Errores

```typescript
{
  error: "Descripción del error",
  stack: "Stack trace para debugging"
}
```

## Límites y Consideraciones

- **Chunk Size**: 1000 registros
- **Timeout**: 60 segundos (plan gratuito)
- **Timeout Preventivo**: 50 segundos
- **Tamaño de Archivo**: Máx 50MB en Storage
- **Tipos de Archivo**: .xlsx, .xls, .csv

## Mapeo de Campos

### Detectados Automáticamente:
- Email (obligatorio)
- Nombre
- Apellido
- Teléfono
- Cédula/Documento de Identidad
- Ciudad
- Género
- Fecha de Nacimiento
- Cómo se enteró

### Asignados Automáticamente:
- `evento_id` → ID del evento "Shows"
- `tipo_ticket_id` → NULL
- `estado` → "confirmado"
- `codigo_ticket` → Auto-generado (TK-xxxxx-xxxxx)
- `metadata` → JSON con género musical, show, fuente

## Detección de Género Musical

La función detecta el género musical basándose en el nombre del archivo:

| Artista | Género |
|---------|--------|
| Rawayana | Reggae/Indie |
| Okills | Rock/Indie |
| Viniloversus | Rock |
| La Vida Boheme | Rock/Indie |
| Arca | Electrónica/Experimental |
| Trueno | Rap/Hip-Hop |
| Ca7riel & Paco Amoroso | Trap/Hip-Hop |
| ROJUU | Trap/R&B |
| Carlos Sadness | Indie Pop |
| Chris Andrade | Comedia/Stand-up |
| NAVILAND | Festival/Electrónica |
| ...y 30+ más |

## Debugging

### Ver logs en tiempo real:
```bash
supabase functions logs process-import-chunk --follow
```

### Probar localmente:
```bash
# Servir funciones localmente
supabase functions serve process-import-chunk

# Invocar desde otro terminal
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-import-chunk' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"queueId":"uuid-de-prueba"}'
```

## Troubleshooting

### Error: "Job no encontrado"
- Verifica que el `queueId` existe en la tabla `importaciones_queue`
- Verifica que el estado sea "pendiente"

### Error: "Error descargando archivo"
- Verifica que el archivo existe en Storage bucket "imports"
- Verifica permisos de Storage

### Error: "Timeout preventivo"
- Normal si el chunk tiene muchos registros complejos
- Los registros procesados antes del timeout se guardan correctamente
- El sistema continuará con el siguiente chunk

### Error: "Email inválido"
- El registro se salta y se registra en errores
- Verifica el formato de email en el archivo fuente

## Monitoreo

La función actualiza automáticamente la tabla `importaciones_queue` con:
- Estado del trabajo (pendiente, procesando, completado, fallido)
- Progreso en porcentaje
- Métricas: procesados, nuevos, actualizados, errores
- Duración en segundos
- Errores detallados en JSONB

## Mantenimiento

### Limpiar trabajos antiguos (SQL):
```sql
DELETE FROM importaciones_queue 
WHERE created_at < NOW() - INTERVAL '30 days'
AND estado IN ('completado', 'fallido', 'cancelado');
```

### Ver estadísticas:
```sql
SELECT 
  estado,
  COUNT(*) as total,
  SUM(registros_nuevos) as total_nuevos,
  SUM(registros_actualizados) as total_actualizados,
  SUM(registros_con_errores) as total_errores,
  AVG(duracion_segundos) as duracion_promedio
FROM importaciones_queue
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY estado;
```
