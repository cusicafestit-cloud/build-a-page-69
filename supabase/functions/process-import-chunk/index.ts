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
    const { queueId, mode = "import", correctedRecords = null } = await req.json()
    
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
    
    // 8. Buscar evento "Shows" y obtener todos los eventos para el mapeo
    const { data: showsEvento } = await supabase
      .from('eventos')
      .select('id, nombre')
      .eq('nombre', 'Shows')
      .maybeSingle()
    
    const eventoShowsId = showsEvento?.id || null
    
    // Obtener todos los eventos para el mapeo en modo preview
    const { data: todosEventos } = await supabase
      .from('eventos')
      .select('id, nombre')
    
    const eventosMap = new Map(todosEventos?.map(e => [e.nombre.toLowerCase(), e]) || [])
    
    // Obtener todos los tipos de tickets para el mapeo
    const { data: todosTickets } = await supabase
      .from('tipos_tickets')
      .select('id, tipo, evento_id')
    
    const ticketsMap = new Map(todosTickets?.map(t => [t.tipo.toLowerCase(), t]) || [])
    
    // 8.1 Validar que las columnas obligatorias existen
    const camposObligatorios = ['email', 'nombre', 'apellido', 'evento_nombre']
    const camposFaltantes = camposObligatorios.filter(campo => !columnMapping[campo])
    
    if (camposFaltantes.length > 0) {
      const headersEncontrados = Object.keys(chunkRows[0] || {})
      const columnasEsperadas = {
        email: 'Email, E-mail, Correo',
        nombre: 'Nombre, First Name',
        apellido: 'Apellido, Last Name',
        evento_nombre: 'Nombre Evento, Evento, Event, Show'
      }
      
      const detallesError = camposFaltantes.map(campo => {
        return `\n  - ${campo}: Se esperaba una columna como: ${columnasEsperadas[campo as keyof typeof columnasEsperadas]}`
      }).join('')
      
      throw new Error(
        `❌ ERROR DE VALIDACIÓN: Columnas obligatorias no detectadas en el archivo.\n\n` +
        `Columnas faltantes:${detallesError}\n\n` +
        `Columnas encontradas en el archivo:\n  ${headersEncontrados.join(', ')}\n\n` +
        `💡 Solución: Verifica que tu archivo Excel tenga los encabezados correctos. ` +
        `Descarga la plantilla oficial desde la interfaz para asegurar el formato correcto.`
      )
    }
    
    // 9. Procesar registros
    let procesados = 0
    let nuevos = 0
    let actualizados = 0
    const errores: any[] = []
    const previewRecords: any[] = []
    
    // Crear un mapa de correcciones si existen
    const correctionsMap = new Map()
    if (correctedRecords && Array.isArray(correctedRecords)) {
      correctedRecords.forEach((record: any) => {
        correctionsMap.set(record.email.toLowerCase(), record)
      })
    }
    
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
        
        // Verificar si hay correcciones para este registro
        const correction = correctionsMap.get(emailLower)
        
        // Extraer IDs opcionales del archivo
        const idEventoFromFile = extractValue(row, columnMapping.id_evento)
        const idTicketFromFile = extractValue(row, columnMapping.id_ticket)
        
        // Buscar evento correspondiente
        let eventoEncontrado = null
        let eventoId: string | null = null
        
        // Si hay corrección aplicada por el usuario, usarla primero
        if (correction && correction.evento_encontrado) {
          eventoEncontrado = correction.evento_encontrado
          eventoId = correction.evento_encontrado.id
        }
        
        // Solo buscar si no hay corrección del usuario
        if (!eventoEncontrado && idEventoFromFile && idEventoFromFile.trim() !== '') {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          if (uuidRegex.test(idEventoFromFile.trim())) {
            eventoId = idEventoFromFile.trim()
            const evento = todosEventos?.find(e => e.id === eventoId)
            if (evento) {
              eventoEncontrado = evento
            }
          }
        }
        
        // Si no hay ID de evento, buscar por nombre
        if (!eventoEncontrado) {
          const eventoNombreLower = eventoNombre.toLowerCase().trim()
          eventoEncontrado = eventosMap.get(eventoNombreLower) || null
          if (eventoEncontrado) {
            eventoId = eventoEncontrado.id
          }
        }
        
        // Si no se encuentra evento específico, usar Shows por defecto
        if (!eventoEncontrado && eventoShowsId) {
          eventoId = eventoShowsId
          eventoEncontrado = showsEvento
        }
        
        // Buscar ticket correspondiente
        let ticketEncontrado = null
        const tipoTicketNombre = extractValue(row, columnMapping.tipo_ticket_nombre)
        
        // Si hay corrección de ticket aplicada por el usuario, usarla
        if (correction && correction.ticket_encontrado) {
          ticketEncontrado = correction.ticket_encontrado
        } else if (idTicketFromFile && idTicketFromFile.trim() !== '') {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          if (uuidRegex.test(idTicketFromFile.trim())) {
            ticketEncontrado = todosTickets?.find(t => t.id === idTicketFromFile.trim()) || null
          }
        } else if (tipoTicketNombre) {
          const ticketNombreLower = tipoTicketNombre.toLowerCase().trim()
          ticketEncontrado = ticketsMap.get(ticketNombreLower) || null
        }
        
        // Validaciones para modo preview
        const recordErrors: string[] = []
        const recordWarnings: string[] = []
        
        if (!eventoEncontrado) {
          recordErrors.push(`No se encontró el evento: ${eventoNombre}`)
        }
        
        if (!ticketEncontrado && tipoTicketNombre) {
          recordWarnings.push(`No se encontró el tipo de ticket: ${tipoTicketNombre}`)
        }
        
        // En modo PREVIEW, solo recopilar información
        if (mode === "preview") {
          previewRecords.push({
            email: emailLower,
            nombre,
            apellido,
            evento_nombre: eventoNombre,
            evento_encontrado: eventoEncontrado ? {
              id: eventoEncontrado.id,
              nombre: eventoEncontrado.nombre
            } : null,
            ticket_encontrado: ticketEncontrado ? {
              id: ticketEncontrado.id,
              tipo: ticketEncontrado.tipo
            } : null,
            estado_validacion: recordErrors.length > 0 ? "error" : 
                               recordWarnings.length > 0 ? "advertencia" : "valido",
            errores: recordErrors,
            advertencias: recordWarnings
          })
          
          if (recordErrors.length === 0) {
            procesados++
          }
          
          continue
        }
        
        // En modo IMPORT, proceder solo si hay evento y ticket válidos
        if (!eventoEncontrado) {
          errores.push({
            fila: job.registros_inicio + i + 2,
            error: `No se encontró el evento: ${eventoNombre}`,
            email: emailLower
          })
          continue
        }
        
        console.log(`🔄 Procesando email: ${emailLower}`)
        
        // Primero verificar si el asistente ya existe
        const { data: existingAsistente } = await supabase
          .from('asistentes')
          .select('*')
          .eq('email', emailLower)
          .maybeSingle()
        
        const metadata = {
          genero_musical: generoMusical,
          show_nombre: extractShowName(job.archivo_nombre),
          fuente_importacion: job.archivo_nombre,
          fecha_importacion: new Date().toISOString()
        }
        
        // Preparar payload con COALESCE de valores existentes
        // Solo actualizar campos que vienen con valor Y están vacíos en la BD
        const asistentePayload: any = {
          email: emailLower,
          // Mantener valores existentes si el nuevo está vacío
          nombre: nombre || existingAsistente?.nombre || nombre,
          apellido: apellido || existingAsistente?.apellido || apellido,
          evento_nombre: eventoNombre || existingAsistente?.evento_nombre || eventoNombre,
          telefono: extractValue(row, columnMapping.telefono) || existingAsistente?.telefono || null,
          documento_identidad: extractValue(row, columnMapping.documento_identidad) || existingAsistente?.documento_identidad || null,
          genero: extractValue(row, columnMapping.genero) || existingAsistente?.genero || null,
          fecha_nacimiento: parseExcelDate(extractValue(row, columnMapping.fecha_nacimiento)) || existingAsistente?.fecha_nacimiento || null,
          direccion: extractValue(row, columnMapping.direccion) || existingAsistente?.direccion || null,
          seccion: extractValue(row, columnMapping.seccion) || existingAsistente?.seccion || null,
          tiketera: extractValue(row, columnMapping.tiketera) || existingAsistente?.tiketera || null,
          tipo_ticket_nombre: extractValue(row, columnMapping.tipo_ticket_nombre) || existingAsistente?.tipo_ticket_nombre || null,
          fecha_compra: parseExcelDate(extractValue(row, columnMapping.fecha_compra)) || existingAsistente?.fecha_compra || null,
          estado: 'confirmado',
          metadata: existingAsistente?.metadata || metadata
        }
        
        // NO incluir evento_id en asistentes - esa relación va en la tabla asistencias
        
        console.log(`📦 Payload asistente:`, JSON.stringify(asistentePayload, null, 2))
        
        // UPSERT en asistentes (sin evento_id)
        const { error: upsertError, data: upsertedAsistente } = await supabase
          .from('asistentes')
          .upsert(asistentePayload, {
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
        const wasNew = !existingAsistente
        if (wasNew) {
          console.log(`✅ Nuevo asistente creado: ${emailLower}`)
          nuevos++
        } else {
          console.log(`✅ Asistente actualizado: ${emailLower}`)
          actualizados++
        }
        
        // CREAR REGISTRO EN ASISTENCIAS si hay evento
        if (eventoId) {
          // Si no hay ticket específico, buscar el primer ticket del evento
          let ticketId = ticketEncontrado?.id
          
          if (!ticketId && eventoEncontrado) {
            // Buscar primer ticket disponible del evento
            const { data: defaultTicket } = await supabase
              .from('tipos_tickets')
              .select('id')
              .eq('evento_id', eventoId)
              .limit(1)
              .maybeSingle()
            
            if (defaultTicket) {
              ticketId = defaultTicket.id
              console.log(`🎫 Usando ticket por defecto ${ticketId} para ${emailLower}`)
            }
          }
          
          if (ticketId) {
            // Verificar si ya existe esta asistencia
            const { data: existingAsistencia } = await supabase
              .from('asistencias')
              .select('id')
              .eq('asistente_id', upsertedAsistente.id)
              .eq('evento_id', eventoId)
              .eq('tipo_ticket_id', ticketId)
              .maybeSingle()
            
            if (!existingAsistencia) {
              const asistenciaPayload = {
                asistente_id: upsertedAsistente.id,
                evento_id: eventoId,
                tipo_ticket_id: ticketId,
                fecha_compra: parseExcelDate(extractValue(row, columnMapping.fecha_compra)) || new Date().toISOString(),
                estado: 'confirmado',
                metadata: {
                  fuente_importacion: job.archivo_nombre,
                  fecha_importacion: new Date().toISOString(),
                  ticket_asignado_automaticamente: !ticketEncontrado?.id
                }
              }
              
              console.log(`📝 Creando asistencia para ${emailLower}:`, JSON.stringify(asistenciaPayload, null, 2))
              
              const { error: asistenciaError } = await supabase
                .from('asistencias')
                .insert(asistenciaPayload)
              
              if (asistenciaError) {
                console.error(`❌ Error creando asistencia para ${emailLower}:`, asistenciaError)
                errores.push({
                  fila: job.registros_inicio + i + 2,
                  error: `Error creando asistencia: ${asistenciaError.message}`,
                  email: emailLower
                })
              } else {
                console.log(`✅ Nueva asistencia creada para ${emailLower} en evento ${eventoEncontrado?.nombre}`)
              }
            } else {
              console.log(`ℹ️ Asistencia ya existe para ${emailLower} en evento ${eventoEncontrado?.nombre}`)
            }
          } else {
            console.warn(`⚠️ No se encontró ticket para el evento ${eventoEncontrado?.nombre}, no se creó asistencia para ${emailLower}`)
          }
        } else {
          console.warn(`⚠️ No hay evento para ${emailLower}, no se creó asistencia`)
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
    
    // En modo PREVIEW, retornar datos de vista previa sin guardar
    if (mode === "preview") {
      await supabase
        .from('importaciones_queue')
        .update({
          estado: 'pendiente', // Mantener pendiente para posterior importación
          updated_at: new Date().toISOString()
        })
        .eq('id', queueId)
      
      return new Response(JSON.stringify({
        success: true,
        mode: "preview",
        preview: previewRecords,
        total: previewRecords.length,
        validos: previewRecords.filter(r => r.estado_validacion === "valido").length,
        errores: previewRecords.filter(r => r.estado_validacion === "error").length,
        advertencias: previewRecords.filter(r => r.estado_validacion === "advertencia").length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // 10. Actualizar trabajo como completado (solo en modo IMPORT)
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
    evento_nombre: ['nombre evento', 'nombreevento', 'evento', 'event', 'event name', 'show', 'concierto', 'espectaculo'],
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
