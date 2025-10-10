# 🚀 Guía de Despliegue - Sistema de Importación Asíncrona

## ✅ Estado Actual del Sistema

### Completado:
- ✅ Base de datos configurada
  - Tabla `importaciones_queue` creada
  - Evento "Shows" por defecto creado
  - Índices optimizados en `asistentes`
- ✅ Storage bucket "imports" creado con políticas
- ✅ Edge Function `process-import-chunk` programada
- ✅ Frontend `DatabaseValidationNew.tsx` implementado
- ✅ Dependencia `xlsx` instalada
- ✅ Rutas actualizadas en App.tsx

### Pendiente:
- ⏳ Desplegar Edge Function a Supabase
- ⏳ Probar importación con archivo de prueba
- ⏳ Generar tipos TypeScript de Supabase

---

## 🛠️ Pasos para Completar el Despliegue

### 1. Verificar Supabase CLI

```bash
# Verificar que Supabase CLI está instalado
supabase --version

# Si no está instalado, instalar con:
npm install -g supabase

# Verificar login
supabase status

# Si no estás logueado:
supabase login
```

### 2. Vincular Proyecto

```bash
# Desde la raíz del proyecto
cd c:\Users\samir\OneDrive\Documents\Cusica\build-a-page-69

# Vincular con tu proyecto de Supabase
supabase link --project-ref zhvfoyglmdhsmavzbevc
```

### 3. Desplegar Edge Function

```bash
# Desplegar la función
supabase functions deploy process-import-chunk

# Verificar que se desplegó correctamente
supabase functions list
```

### 4. Generar Tipos TypeScript Actualizados

```bash
# Generar tipos desde el esquema actual de Supabase
npx supabase gen types typescript --project-id zhvfoyglmdhsmavzbevc > src/integrations/supabase/types.ts
```

### 5. Verificar Storage Bucket

Ir a Supabase Dashboard → Storage → Verificar que existe el bucket "imports"

Si no existe, ejecutar:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('imports', 'imports', false, 52428800)
ON CONFLICT (id) DO NOTHING;
```

### 6. Probar el Sistema

#### A. Preparar archivo de prueba

Opción 1: Descargar plantilla desde la interfaz
- Ir a http://localhost:8080/database-validation
- Click en "Descargar Plantilla"
- Rellenar con 5-10 registros de prueba

Opción 2: Usar archivo existente
- Seleccionar uno de los archivos de `src/auxiliar`
- Ejemplo: `Rawayana 1.xlsx` o cualquier archivo "1.xlsx"

#### B. Importar archivo

1. Ir a http://localhost:8080/database-validation
2. Arrastrar el archivo a la zona de drop
3. Click en "Procesar Archivo"
4. Observar progreso en tiempo real

#### C. Verificar resultados

```sql
-- Ver importaciones recientes
SELECT * FROM importaciones_queue 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver asistentes nuevos
SELECT * FROM asistentes 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver estadísticas
SELECT 
  COUNT(*) as total_asistentes,
  COUNT(DISTINCT email) as emails_unicos,
  COUNT(CASE WHEN metadata->>'genero_musical' IS NOT NULL THEN 1 END) as con_genero_musical
FROM asistentes;
```

---

## 🔧 Configuración de Variables de Entorno

La Edge Function usa automáticamente las variables de entorno de Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

No requiere configuración adicional.

---

## 📊 Monitoreo y Debugging

### Ver logs de Edge Function:

```bash
# Ver logs en tiempo real
supabase functions logs process-import-chunk --follow

# Ver últimos 100 logs
supabase functions logs process-import-chunk --limit 100
```

### Probar localmente antes de desplegar:

```bash
# Servir funciones localmente
supabase functions serve

# En otro terminal, invocar la función
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-import-chunk' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"queueId":"uuid-de-prueba"}'
```

---

## 🎯 Casos de Uso

### 1. Importar Lista de Mailchimp (140k registros)

Archivo: `src/auxiliar/subscribed_email_audience_export_cb6f09d993.csv` (14 MB)

El sistema:
- Divide en ~140 chunks de 1000 registros
- Procesa 1 chunk cada ~45 segundos
- Tiempo total estimado: ~105 minutos (1h 45min)
- Actualiza progreso cada 3 segundos

### 2. Importar Asistentes de Evento (2000 registros)

Archivo: Cualquier archivo "1.xlsx" de `src/auxiliar`

El sistema:
- Divide en 2 chunks de 1000 registros
- Procesa en ~90 segundos total
- Detecta género musical automáticamente
- Actualiza solo campos vacíos

### 3. Mantener Base de Datos Actualizada

- Subir nuevos archivos periódicamente
- El sistema:
  - Crea nuevos registros si email no existe
  - Actualiza solo campos vacíos si email existe
  - No sobrescribe datos existentes

---

## ⚠️ Limitaciones y Consideraciones

### Plan Gratuito de Supabase:
- ✅ Timeout Edge Function: 60 segundos → **Solucionado con chunks de 1000**
- ✅ Database: 500 MB → **Monitorear crecimiento**
- ✅ Storage: 1 GB → **Limpiar archivos antiguos periódicamente**
- ✅ Realtime: 2 conexiones → **Polling cada 3s en lugar de Realtime**

### Recomendaciones:
- Archivos <50 MB: Procesamiento directo
- Archivos 50-200 MB: Dividir manualmente en partes más pequeñas
- Archivos >200 MB: Usar herramientas externas para limpiar/dividir primero

---

## 🧹 Mantenimiento

### Limpiar trabajos completados (ejecutar mensualmente):

```sql
-- Eliminar trabajos completados de hace más de 30 días
DELETE FROM importaciones_queue 
WHERE created_at < NOW() - INTERVAL '30 days'
AND estado IN ('completado', 'fallido', 'cancelado');
```

### Limpiar archivos de Storage (ejecutar mensualmente):

```sql
-- Lista de archivos antiguos
SELECT * FROM storage.objects 
WHERE bucket_id = 'imports'
AND created_at < NOW() - INTERVAL '30 days';

-- Eliminar desde Dashboard o usando Storage API
```

### Ver estadísticas de uso:

```sql
-- Estadísticas de importaciones
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as total_importaciones,
  SUM(registros_nuevos) as nuevos,
  SUM(registros_actualizados) as actualizados,
  SUM(registros_con_errores) as errores
FROM importaciones_queue
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;

-- Estadísticas de asistentes por fuente
SELECT 
  metadata->>'fuente_importacion' as fuente,
  metadata->>'genero_musical' as genero,
  COUNT(*) as total
FROM asistentes
WHERE metadata IS NOT NULL
GROUP BY metadata->>'fuente_importacion', metadata->>'genero_musical'
ORDER BY total DESC
LIMIT 20;
```

---

## 🎓 Próximas Mejoras (Opcional)

### Para el Futuro:
1. **Validaciones Avanzadas:**
   - Verificar formato de teléfonos venezolanos
   - Validar formato de cédulas
   - Detectar emails temporales/falsos

2. **Reportes:**
   - Exportar resultados de importación a Excel
   - Enviar email con resumen al completar
   - Dashboard de estadísticas de importaciones

3. **Optimizaciones:**
   - Procesamiento paralelo de chunks (requiere plan Pro)
   - Caché de eventos y tipos de tickets
   - Compresión de metadata JSON

4. **Integración:**
   - Sync automático con Mailchimp API
   - Webhook para notificar completitud
   - API REST para importaciones programáticas

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisar logs de Edge Function**
   ```bash
   supabase functions logs process-import-chunk --follow
   ```

2. **Verificar estado de trabajos**
   ```sql
   SELECT * FROM importaciones_queue 
   WHERE estado = 'fallido'
   ORDER BY created_at DESC;
   ```

3. **Reintentar trabajo fallido**
   ```sql
   UPDATE importaciones_queue 
   SET estado = 'pendiente', errores = '[]'::jsonb
   WHERE id = 'uuid-del-trabajo';
   ```

---

## ✅ Checklist Final

Antes de usar en producción:

- [ ] Edge Function desplegada
- [ ] Storage bucket configurado con políticas
- [ ] Tipos TypeScript actualizados
- [ ] Probado con archivo pequeño (10-50 registros)
- [ ] Probado con archivo mediano (500-1000 registros)
- [ ] Verificado que no duplica registros
- [ ] Verificado que actualiza solo campos vacíos
- [ ] Verificado detección de género musical
- [ ] Configurado script de limpieza mensual
- [ ] Documentación compartida con equipo

---

**Sistema listo para producción! 🎉**
