import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { validation_id } = await req.json();

    if (!validation_id) {
      throw new Error('validation_id es requerido');
    }

    console.log('Ejecutando validación:', validation_id);

    // Actualizar estado a "ejecutando"
    await supabase
      .from('validaciones_bd')
      .update({ estado: 'ejecutando' })
      .eq('id', validation_id);

    // Obtener la validación
    const { data: validation, error: fetchError } = await supabase
      .from('validaciones_bd')
      .select('*')
      .eq('id', validation_id)
      .single();

    if (fetchError || !validation) {
      throw new Error('Validación no encontrada');
    }

    console.log('Validación obtenida:', validation.nombre);

    // Verificar que solo sea SELECT
    const sqlUpper = validation.consulta_sql.trim().toUpperCase();
    if (!sqlUpper.startsWith('SELECT')) {
      throw new Error('Solo se permiten consultas SELECT');
    }

    const startTime = Date.now();
    
    // Ejecutar la consulta con timeout
    const { data: result, error: queryError } = await supabase.rpc('execute_readonly_query', {
      query_text: validation.consulta_sql
    });

    const duration = (Date.now() - startTime) / 1000;

    if (queryError) {
      console.error('Error ejecutando consulta:', queryError);
      
      await supabase
        .from('validaciones_bd')
        .update({
          estado: 'fallido',
          duracion_segundos: duration,
          ultima_ejecucion: new Date().toISOString(),
          detalles_resultado: { error: queryError.message },
        })
        .eq('id', validation_id);

      return new Response(
        JSON.stringify({ success: false, error: queryError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Contar problemas encontrados
    const problemsFound = Array.isArray(result) ? result.length : 0;

    console.log(`Problemas encontrados: ${problemsFound}`);

    // Calcular próxima ejecución
    const nextExecution = new Date();
    nextExecution.setHours(nextExecution.getHours() + validation.frecuencia_horas);

    // Actualizar validación con resultados
    await supabase
      .from('validaciones_bd')
      .update({
        estado: 'completado',
        ultima_ejecucion: new Date().toISOString(),
        proxima_ejecucion: nextExecution.toISOString(),
        duracion_segundos: duration,
        problemas_encontrados: problemsFound,
        detalles_resultado: { datos: result },
      })
      .eq('id', validation_id);

    console.log('Validación completada exitosamente');

    return new Response(
      JSON.stringify({
        success: true,
        duration,
        problemsFound,
        details: result,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error en execute-validation-check:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
