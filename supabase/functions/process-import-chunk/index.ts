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
    const chunkRows = allRows.slice(job.registros_inicio, job.registros_fin + 1)
    
    if (chunkRows.length === 0) {
      throw new Error('No hay registros en este chunk')
    }
    
    // 6. Detectar género musical del nombre del archivo
    const generoMusical = detectGeneroMusical(job.archivo_nombre)
    
    // 7. Mapear columnas automáticamente
    const columnMapping = autoMapColumns(Object.keys(chunkRows[0] || {}))
    
    console.log('Mapeo de columnas:', columnMapping)
    
    // 8. Buscar evento "Shows"
    const { data: showsEvento } = await supabase
      .from('eventos')
      .select('id')
      .eq('nombre', 'Shows')
      .single()
    
    const eventoShowsId = showsEvento?.id || '00000000-0000-0000-0000-000000000001'
    
    // 9. Procesar registros
    let procesados = 0
    let nuevos = 0
    let actualizados = 0
    const errores: any[] = []
    
    for (let i = 0; i < chunkRows.length; i++) {
      const row = chunkRows[i]
      
      try {
        const email = extractValue(row, columnMapping.email)
        
        if (!email || !isValidEmail(email)) {
          errores.push({
            fila: job.registros_inicio + i + 2, // +2 porque Excel empieza en 1 y tiene header
            error: 'Email inválido o faltante',
            email: email || 'N/A'
          })
          continue
        }
        
        const emailLower = email.toLowerCase().trim()
        const nombre = extractValue(row, columnMapping.nombre) || 'Sin nombre'
        
        // Verificar si existe
        const { data: existing } = await supabase
          .from('asistentes')
          .select('*')
          .eq('email', emailLower)
          .maybeSingle()
        
        const metadata = {
          genero_musical: generoMusical,
          show_nombre: extractShowName(job.archivo_nombre),
          fuente_importacion: job.archivo_nombre,
          fecha_importacion: new Date().toISOString(),
          ...(existing?.metadata as object || {})
        }
        
        if (existing) {
          // ACTUALIZAR TODOS los campos del Excel (excepto email que es el identificador)
          console.log(`📝 Actualizando registro existente: ${emailLower}`)
          
          const updates: any = { 
            nombre: nombre,
            apellido: extractValue(row, columnMapping.apellido),
            telefono: extractValue(row, columnMapping.telefono),
            documento_identidad: extractValue(row, columnMapping.documento_identidad),
            genero: extractValue(row, columnMapping.genero),
            fecha_nacimiento: parseExcelDate(extractValue(row, columnMapping.fecha_nacimiento)),
            direccion: extractValue(row, columnMapping.direccion),
            seccion: extractValue(row, columnMapping.seccion),
            tiketera: extractValue(row, columnMapping.tiketera),
            tipo_ticket_nombre: extractValue(row, columnMapping.tipo_ticket_nombre),
            fecha_compra: parseExcelDate(extractValue(row, columnMapping.fecha_compra)),
            updated_at: new Date().toISOString(),
            metadata: metadata
          }
          
          console.log(`📦 Datos a actualizar:`, JSON.stringify(updates, null, 2))
          
          const { error: updateError } = await supabase
            .from('asistentes')
            .update(updates)
            .eq('email', emailLower)
          
          if (updateError) {
            console.error(`❌ Error actualizando ${emailLower}:`, updateError)
            throw new Error(`Error actualizando: ${updateError.message}`)
          }
          
          console.log(`✅ Registro actualizado exitosamente: ${emailLower}`)
          actualizados++
        } else {
          // CREAR nuevo asistente
          const newRecord = {
            email: emailLower,
            nombre,
            apellido: extractValue(row, columnMapping.apellido),
            telefono: extractValue(row, columnMapping.telefono),
            documento_identidad: extractValue(row, columnMapping.documento_identidad),
            genero: extractValue(row, columnMapping.genero),
            fecha_nacimiento: parseExcelDate(extractValue(row, columnMapping.fecha_nacimiento)),
            direccion: extractValue(row, columnMapping.direccion),
            seccion: extractValue(row, columnMapping.seccion),
            tiketera: extractValue(row, columnMapping.tiketera),
            tipo_ticket_nombre: extractValue(row, columnMapping.tipo_ticket_nombre),
            fecha_compra: parseExcelDate(extractValue(row, columnMapping.fecha_compra)),
            evento_id: eventoShowsId,
            estado: 'confirmado',
            metadata: metadata
          }
          
          const { error: insertError } = await supabase
            .from('asistentes')
            .insert(newRecord)
          
          if (insertError) {
            throw new Error(`Error insertando: ${insertError.message}`)
          }
          
          nuevos++
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

// Convertir fecha de formato DD/MM/YYYY o DD/MM/YYYY HH:mm al formato ISO
function parseExcelDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  
  try {
    const str = String(dateStr).trim()
    
    // Si ya es ISO, devolver tal cual
    if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
      return str
    }
    
    // Intentar parsear formato DD/MM/YYYY o DD/MM/YYYY HH:mm
    const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/)
    if (match) {
      const [_, day, month, year, hours, minutes] = match
      
      // Construir fecha ISO
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      
      if (hours && minutes) {
        return `${isoDate}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`
      }
      
      return isoDate
    }
    
    console.warn(`Formato de fecha no reconocido: ${str}`)
    return null
  } catch (e) {
    console.error(`Error parseando fecha: ${dateStr}`, e)
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
  
  // Mapeo exacto según plantilla proporcionada
  const patterns = {
    email: ['email'],
    telefono: ['phone number'],
    nombre: ['client first name'],
    documento_identidad: ['document id'],
    fecha_nacimiento: ['birth date'],
    genero: ['gender'],
    apellido: ['client last name'],
    direccion: ['billing address'],
    seccion: ['section'],
    tiketera: ['referrer'],
    tipo_ticket_nombre: ['section'], // Section también se mapea a tipo_ticket_nombre
    fecha_compra: ['fecha de compra']
  }
  
  for (const [field, keywords] of Object.entries(patterns)) {
    const matches = headers.filter(h => {
      const headerLower = h.toLowerCase().trim()
      return keywords.some(k => headerLower.includes(k))
    })
    
    if (matches.length > 0) {
      mapping[field] = matches
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
