import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import * as XLSX from "https://esm.sh/xlsx@0.18.5"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  
  try {
    const { queueId } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // 1. Obtener trabajo de la cola
    const { data: job, error: jobError } = await supabase
      .from('importaciones_queue')
      .select('*')
      .eq('id', queueId)
      .single()
    
    if (jobError || !job) {
      throw new Error(`Job no encontrado: ${jobError?.message}`)
    }
    
    if (job.estado !== 'pendiente') {
      return new Response(JSON.stringify({ 
        error: 'Job no está en estado pendiente',
        estado: job.estado 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // 2. Marcar como procesando
    await supabase
      .from('importaciones_queue')
      .update({ 
        estado: 'procesando',
        updated_at: new Date().toISOString()
      })
      .eq('id', queueId)
    
    // 3. Descargar archivo de Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('imports')
      .download(job.archivo_url)
    
    if (downloadError) {
      throw new Error(`Error descargando archivo: ${downloadError.message}`)
    }
    
    const buffer = await fileData.arrayBuffer()
    
    // 4. Parsear Excel/CSV
    const workbook = XLSX.read(buffer)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const allRows = XLSX.utils.sheet_to_json(sheet)
    
    // 5. Extraer solo el chunk asignado
    // Si registros_fin es 0, significa que debe procesar todas las filas disponibles
    const endIndex = job.registros_fin === 0 ? allRows.length : job.registros_fin + 1
    const chunkRows = allRows.slice(job.registros_inicio, endIndex)
    
    if (chunkRows.length === 0) {
      throw new Error('No hay registros en este chunk')
    }
    
    // 6. Detectar género musical del nombre del archivo
    const generoMusical = detectGeneroMusical(job.archivo_nombre)
    
    // 7. Mapear columnas automáticamente
    const columnMapping = autoMapColumns(Object.keys(chunkRows[0] || {}))
    
    console.log('Mapeo de columnas:', columnMapping)
    
    // 8. Buscar evento "Shows" (sin fallback a UUID dummy)
    const { data: showsEvento } = await supabase
      .from('eventos')
      .select('id')
      .eq('nombre', 'Shows')
      .maybeSingle()
    
    const eventoShowsId = showsEvento?.id || null
    
    // 8.1 Validar que las columnas obligatorias existen
    const camposObligatorios = ['email', 'nombre', 'apellido', 'evento_nombre']
    const camposFaltantes = camposObligatorios.filter(campo => !columnMapping[campo])
    
    if (camposFaltantes.length > 0) {
      throw new Error(`Columnas obligatorias no detectadas: ${camposFaltantes.join(', ')}. Verifica los encabezados del archivo.`)
    }
    
    // 9. Procesar registros
    let procesados = 0
    let nuevos = 0
    let actualizados = 0
    const errores: any[] = []
    
    for (let i = 0; i < chunkRows.length; i++) {
      const row = chunkRows[i]
      
      try {
        // Validar campos obligatorios
        const email = extractValue(row, columnMapping.email)
        const nombre = extractValue(row, columnMapping.nombre)
        const apellido = extractValue(row, columnMapping.apellido)
        const eventoNombre = extractValue(row, columnMapping.evento_nombre)
        
        // Validar email
        if (!email || !isValidEmail(email)) {
          errores.push({
            fila: job.registros_inicio + i + 2,
            error: 'Email inválido o faltante',
            email: email || 'N/A'
          })
          continue
        }
        
        // Validar nombre
        if (!nombre || nombre.trim() === '') {
          errores.push({
            fila: job.registros_inicio + i + 2,
            error: 'Nombre es obligatorio',
            email: email
          })
          continue
        }
        
        // Validar apellido
        if (!apellido || apellido.trim() === '') {
          errores.push({
            fila: job.registros_inicio + i + 2,
            error: 'Apellido es obligatorio',
            email: email
          })
          continue
        }
        
        // Validar nombre evento
        if (!eventoNombre || eventoNombre.trim() === '') {
          errores.push({
            fila: job.registros_inicio + i + 2,
            error: 'Nombre Evento es obligatorio',
            email: email
          })
          continue
        }
        
        const emailLower = email.toLowerCase().trim()
        
        // Extraer IDs opcionales del archivo
        const idEventoFromFile = extractValue(row, columnMapping.id_evento)
        const idTicketFromFile = extractValue(row, columnMapping.id_ticket)
        
        const metadata = {
          genero_musical: generoMusical,
          show_nombre: extractShowName(job.archivo_nombre),
          fuente_importacion: job.archivo_nombre,
          fecha_importacion: new Date().toISOString()
        }
        
        // UPSERT: insertar o actualizar en una sola operación
        const payload: any = {
          email: emailLower,
          nombre,
          apellido,
          evento_nombre: eventoNombre,
          telefono: extractValue(row, columnMapping.telefono),
          documento_identidad: extractValue(row, columnMapping.documento_identidad),
          genero: extractValue(row, columnMapping.genero),
          fecha_nacimiento: parseExcelDate(extractValue(row, columnMapping.fecha_nacimiento)),
          direccion: extractValue(row, columnMapping.direccion),
          seccion: extractValue(row, columnMapping.seccion),
          tiketera: extractValue(row, columnMapping.tiketera),
          tipo_ticket_nombre: extractValue(row, columnMapping.tipo_ticket_nombre),
          fecha_compra: parseExcelDate(extractValue(row, columnMapping.fecha_compra)),
          estado: 'confirmado',
          metadata
        }
        
        // Solo incluir evento_id si existe en el archivo O usar el de Shows por defecto
        if (idEventoFromFile && idEventoFromFile.trim() !== '') {
          // Validar que sea un UUID válido
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          if (uuidRegex.test(idEventoFromFile.trim())) {
            payload.evento_id = idEventoFromFile.trim()
          } else {
            console.warn(`⚠️ ID Evento inválido para ${emailLower}: ${idEventoFromFile}`)
          }
        } else if (eventoShowsId) {
          payload.evento_id = eventoShowsId
        }
        
        console.log(`🔄 Procesando email: ${emailLower}`)
        console.log(`📦 Payload:`, JSON.stringify(payload, null, 2))
        
        // Primero intentar obtener el registro existente
        const { data: existing } = await supabase
          .from('asistentes')
          .select('id, created_at')
          .eq('email', emailLower)
          .maybeSingle()
        
        const { error: upsertError, data: upsertData } = await supabase
          .from('asistentes')
          .upsert(payload, { 
            onConflict: 'email',
            ignoreDuplicates: false 
          })
          .select('id, created_at, updated_at')
          .single()
        
        if (upsertError) {
          console.error(`❌ Error en upsert para ${emailLower}:`, upsertError)
          throw new Error(`Error en upsert: ${upsertError.message}`)
        }
        
        // Determinar si fue nuevo o actualizado
        const wasNew = !existing
        if (wasNew) {
          console.log(`✅ Nuevo registro creado: ${emailLower}`)
          nuevos++
        } else {
          console.log(`✅ Registro actualizado: ${emailLower}`)
          actualizados++
        }
        
        procesados++
        
      } catch (error: any) {
        errores.push({
          fila: job.registros_inicio + i + 2,
          error: error.message || String(error),
          email: extractValue(row, columnMapping.email) || 'N/A'
        })
      }
      
      // Límite de tiempo: salir si quedan <10s
      const elapsed = (Date.now() - startTime) / 1000
      if (elapsed > 50) { // 50 segundos de seguridad (límite 60s)
        errores.push({
          error: 'Timeout preventivo - tiempo excedido',
          registros_pendientes: chunkRows.length - i - 1
        })
        break
      }
    }
    
    // 10. Actualizar trabajo como completado
    const duracion = Math.floor((Date.now() - startTime) / 1000)
    
    await supabase
      .from('importaciones_queue')
      .update({
        estado: errores.length === chunkRows.length ? 'fallido' : 'completado',
        progreso_porcentaje: 100,
        registros_procesados: procesados,
        registros_nuevos: nuevos,
        registros_actualizados: actualizados,
        registros_con_errores: errores.length,
        errores: errores,
        campos_detectados: columnMapping,
        genero_musical_detectado: generoMusical,
        tiempo_fin: new Date().toISOString(),
        duracion_segundos: duracion,
        updated_at: new Date().toISOString()
      })
      .eq('id', queueId)
    
    // 11. Ejecutar validaciones de integridad automáticamente
    if (errores.length < chunkRows.length) { // Solo si hubo al menos un registro exitoso
      try {
        const { data: validaciones } = await supabase
          .from('validaciones_bd')
          .select('id')
          .eq('activa', true)
          .eq('tipo', 'integridad')
        
        if (validaciones && validaciones.length > 0) {
          // Ejecutar validaciones en paralelo sin esperar
          for (const val of validaciones) {
            supabase.functions.invoke('execute-validation-check', {
              body: { validation_id: val.id }
            }).catch(err => console.error('Error ejecutando validación:', err))
          }
        }
      } catch (validationError) {
        console.error('Error al ejecutar validaciones:', validationError)
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      procesados,
      nuevos,
      actualizados,
      errores: errores.length,
      duracion,
      genero_musical: generoMusical
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error: any) {
    console.error('Error fatal:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message || String(error),
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// ============= FUNCIONES AUXILIARES =============

// Convertir fecha de múltiples formatos al formato ISO que PostgreSQL entiende
function parseExcelDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  
  try {
    const str = String(dateStr).trim()
    
    // Si ya es ISO válido (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss), devolver tal cual
    if (str.match(/^\d{4}-\d{2}-\d{2}(T|\s|$)/)) {
      return str
    }
    
    // Si es un número (fecha de Excel como días desde 1900-01-01)
    if (!isNaN(Number(str)) && Number(str) > 1000) {
      const excelEpoch = new Date(1899, 11, 30) // Excel cuenta desde 1900-01-01
      const days = Number(str)
      const date = new Date(excelEpoch.getTime() + days * 86400000)
      return date.toISOString().split('T')[0]
    }
    
    // Formato: DD/MM/YYYY HH:mm:ss o DD/MM/YYYY HH:mm
    let match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/)
    if (match) {
      const [_, day, month, year, hours, minutes, seconds] = match
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      
      if (hours && minutes) {
        return `${isoDate}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${(seconds || '00').padStart(2, '0')}`
      }
      
      return isoDate
    }
    
    // Formato: DD-MM-YYYY HH:mm:ss o DD-MM-YYYY
    match = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/)
    if (match) {
      const [_, day, month, year, hours, minutes, seconds] = match
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      
      if (hours && minutes) {
        return `${isoDate}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${(seconds || '00').padStart(2, '0')}`
      }
      
      return isoDate
    }
    
    // Formato: MM/DD/YYYY (formato americano) - intentar solo si el día es > 12
    match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (match) {
      const [_, first, second, year] = match
      
      // Si first > 12, probablemente es DD/MM/YYYY
      if (Number(first) > 12) {
        const isoDate = `${year}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`
        return isoDate
      }
      
      // Si second > 12, definitivamente es MM/DD/YYYY
      if (Number(second) > 12) {
        const isoDate = `${year}-${first.padStart(2, '0')}-${second.padStart(2, '0')}`
        return isoDate
      }
    }
    
    // Formato: YYYY/MM/DD
    match = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/)
    if (match) {
      const [_, year, month, day] = match
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    // Intentar parsear como Date y convertir a ISO
    const date = new Date(str)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
    
    console.warn(`⚠️ Formato de fecha no reconocido: ${str}`)
    return null
  } catch (e) {
    console.error(`❌ Error parseando fecha: ${dateStr}`, e)
    return null
  }
}

function detectGeneroMusical(filename: string): string {
  const nombre = filename.toLowerCase()
  
  // Mapeo de artistas a géneros musicales
  const generos: Record<string, string> = {
    'rawayana': 'Reggae/Indie',
    'okills': 'Rock/Indie',
    'viniloversus': 'Rock',
    'la vida boheme': 'Rock/Indie',
    'arca': 'Electrónica/Experimental',
    'trueno': 'Rap/Hip-Hop',
    'ca7riel': 'Trap/Hip-Hop',
    'paco amoroso': 'Trap/Hip-Hop',
    'rojuu': 'Trap/R&B',
    'bandalos chinos': 'Indie Pop',
    'alleh': 'Rock/Indie',
    'yorghaki': 'Rock/Indie',
    'cantamarta': 'Indie Pop',
    'chris andrade': 'Comedia/Stand-up',
    'carlos sadness': 'Indie Pop',
    'nella': 'Urbano',
    'tepedino': 'Indie',
    'stangah': 'Electrónica',
    'naviland': 'Festival/Electrónica',
    'cuarteto de nos': 'Rock Alternativo',
    'esteman': 'Pop',
    'rodrigo': 'Indie',
    'piña': 'Comedia/Stand-up',
    'sick feel': 'Hip-Hop',
    'novanout': 'Urbano/Trap',
    'nueve noventa': 'Rock',
    'plomo': 'Rock',
    'ava casas': 'Indie Pop',
    'boiler room': 'Electrónica/DJ',
    'natalia lafourcade': 'Pop/Folk',
    'wincho': 'Comedia/Stand-up',
    'wei': 'K-Pop',
    'virtual animal': 'Electrónica',
    'xpace': 'Electrónica/Techno',
    'cusica fest': 'Festival/Multi-género',
    'stand up': 'Comedia/Stand-up',
    'cherlatte': 'Urbano/R&B',
    'michael lebeats': 'Urbano/R&B'
  }
  
  for (const [artista, genero] of Object.entries(generos)) {
    if (nombre.includes(artista)) {
      return genero
    }
  }
  
  return 'Variado'
}

function extractShowName(filename: string): string {
  // Extraer nombre del show del archivo
  // Remover extensión, números de versión y guiones bajos
  return filename
    .replace(/\s+\d+\.xlsx?$/i, '')
    .replace(/\.xlsx?$/i, '')
    .replace(/\.csv$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+\(\d+\)/g, '')
    .trim()
}

function autoMapColumns(headers: string[]): Record<string, string[]> {
  const mapping: Record<string, string[]> = {}
  const H = headers.map(h => h.toLowerCase().trim())
  
  // Patrones ampliados para detectar múltiples variaciones
  const patterns = {
    email: ['email', 'e-mail', 'correo', 'correo electronico', 'correo electrónico', 'email address', 'buyer email', 'mail'],
    telefono: ['phone', 'phone number', 'tel', 'telefono', 'teléfono', 'mobile', 'celular'],
    nombre: ['nombre', 'first name', 'client first name', 'given name', 'primer nombre'],
    apellido: ['apellido', 'last name', 'client last name', 'family name', 'surname'],
    evento_nombre: ['evento', 'nombre evento', 'event', 'event name', 'show', 'concierto', 'espectaculo'],
    id_evento: ['id evento', 'evento id', 'event id', 'id_evento'],
    id_ticket: ['id ticket', 'ticket id', 'id_ticket', 'tipo ticket id'],
    documento_identidad: ['document', 'document id', 'documento', 'documento id', 'dni', 'cedula', 'cédula', 'id number', 'identification'],
    fecha_nacimiento: ['birth', 'birth date', 'fecha nacimiento', 'fecha de nacimiento', 'dob', 'birthdate'],
    genero: ['gender', 'sexo', 'género', 'sex'],
    direccion: ['direccion', 'dirección', 'address', 'billing address', 'street', 'domicilio'],
    seccion: ['seccion', 'sección', 'section', 'sector', 'area'],
    tiketera: ['referrer', 'tiketera', 'ticketera', 'origen', 'source', 'plataforma'],
    tipo_ticket_nombre: ['ticket type', 'tipo ticket', 'tipo de ticket', 'ticket', 'entrada', 'boleto', 'pass'],
    fecha_compra: ['purchase date', 'order date', 'fecha compra', 'fecha de compra', 'date', 'purchase', 'compra']
  }
  
  const pick = (keys: string[]) => {
    const found: string[] = []
    for (const key of keys) {
      const idx = H.findIndex(h => h.includes(key))
      if (idx >= 0 && !found.includes(headers[idx])) {
        found.push(headers[idx])
      }
    }
    return found.length ? found : null
  }
  
  for (const [field, keys] of Object.entries(patterns)) {
    const result = pick(keys)
    if (result) {
      mapping[field] = result
    }
  }
  
  // Si no encontró email, intenta descubrirlo por patrón
  if (!mapping.email) {
    const emailCandidates = headers.filter(h => /mail|correo/i.test(h))
    if (emailCandidates.length) {
      mapping.email = emailCandidates
    }
  }
  
  return mapping
}

function extractValue(row: any, columns?: string[]): string | null {
  if (!columns || columns.length === 0) return null
  
  for (const col of columns) {
    const value = row[col]
    if (value !== null && value !== undefined && value !== '') {
      return String(value).trim()
    }
  }
  
  return null
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function generateTicketCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `TK-${timestamp}-${random}`
}
