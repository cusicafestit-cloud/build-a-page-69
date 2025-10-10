import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API key de Resend
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

// Crear cliente de Supabase para operaciones de base de datos
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CanjeErrorData {
  canje_id: string;
}

// Función para enviar email usando Resend API directamente
async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Soporte Canjes <onboarding@resend.dev>', // Cambiar por tu dominio verificado
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error enviando email: ${response.status} - ${error}`);
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando proceso de notificación de error de canje');
    
    const { canje_id }: CanjeErrorData = await req.json();
    
    if (!canje_id) {
      throw new Error('canje_id es requerido');
    }

    console.log(`📋 Procesando canje ID: ${canje_id}`);

    // 1. Obtener datos del canje y verificar que ERROR_TP = true y no se haya enviado email
    const { data: canje, error: canjeError } = await supabase
      .from('canjes')
      .select(`
        id,
        "ERROR_TP",
        email_error_enviado,
        correo,
        nombre_asistente,
        apellido_asistente
      `)
      .eq('id', canje_id)
      .single();

    if (canjeError) {
      console.error('❌ Error obteniendo datos del canje:', canjeError);
      throw canjeError;
    }

    if (!canje) {
      throw new Error('Canje no encontrado');
    }

    console.log(`📧 Canje encontrado - Email: ${canje.correo}, ERROR_TP: ${canje.ERROR_TP}, Email enviado: ${canje.email_error_enviado}`);

    // Verificar condiciones para enviar email
    if (!canje.ERROR_TP) {
      console.log('⚠️ El canje no tiene ERROR_TP = true, no se enviará email');
      return new Response(
        JSON.stringify({ message: 'Canje no tiene error, no se envía email' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (canje.email_error_enviado) {
      console.log('⚠️ Ya se envió email previamente para este canje');
      return new Response(
        JSON.stringify({ message: 'Email ya fue enviado previamente' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Preparar datos para el email
    const nombre = canje.nombre_asistente || 'Estimado/a';
    const apellido = canje.apellido_asistente || '';
    const nombreCompleto = `${nombre} ${apellido}`.trim();
    const email = canje.correo;

    if (!email) {
      throw new Error('El canje no tiene un email asociado');
    }

    // 3. Crear mensaje de WhatsApp pre-escrito con el email del asistente
    const whatsappMessage = encodeURIComponent(
      `Hola, necesito ayuda con mi canje. Mi correo es ${email}`
    );
    const whatsappUrl = `https://wa.me/584122097456?text=${whatsappMessage}`;

    console.log('📝 Preparando email...');

    // 4. Construir el HTML del email
    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error en Proceso de Canje</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                ⚠️ Atención Requerida
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">
                Hola ${nombreCompleto},
              </h2>
              
              <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Lamentamos informarte que tu <strong>solicitud de canje no pudo ser procesada automáticamente</strong> en nuestro sistema.
              </p>
              
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>No te preocupes:</strong> Nuestro equipo está listo para ayudarte a completar el proceso de forma manual y asegurar que recibas tu canje exitosamente.
                </p>
              </div>
              
              <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Para resolver esta situación de manera rápida y eficiente, por favor contáctanos directamente a través de WhatsApp:
              </p>
              
              <!-- WhatsApp Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${whatsappUrl}" 
                       style="background-color: #25D366; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 50px; display: inline-block; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3); transition: all 0.3s;">
                      💬 Contactar por WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 20px 0; text-align: center;">
                También puedes escribirnos directamente al:<br>
                <strong style="color: #25D366; font-size: 18px;">+58 412 209 7456</strong>
              </p>
              
              <div style="background-color: #e8f4fd; border-left: 4px solid #2196F3; padding: 15px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #1565c0; margin: 0; font-size: 14px;">
                  <strong>💡 Tip:</strong> Ten a mano tu correo electrónico (<strong>${email}</strong>) para agilizar el proceso.
                </p>
              </div>
              
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                Estamos aquí para ayudarte,<br>
                <strong style="color: #667eea;">El Equipo de Soporte</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0; line-height: 1.4;">
                Este es un correo automático. Por favor no respondas a este mensaje.<br>
                Si necesitas ayuda, usa el botón de WhatsApp arriba.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // 5. Enviar email usando Resend
    console.log(`📮 Enviando email a: ${email}`);
    
    const emailResponse = await sendEmail(
      email,
      '⚠️ Tu Canje Requiere Atención - Contacta con Soporte',
      emailHtml
    );

    console.log('✅ Email enviado exitosamente:', emailResponse);

    // 6. Actualizar el canje para marcar que se envió el email
    const { error: updateError } = await supabase
      .from('canjes')
      .update({
        email_error_enviado: true,
        fecha_email_error: new Date().toISOString()
      })
      .eq('id', canje_id);

    if (updateError) {
      console.error('❌ Error actualizando estado del canje:', updateError);
      // Registrar en logs aunque falle la actualización
      await supabase
        .from('logs_notificaciones_canje')
        .insert({
          canje_id: canje_id,
          email_enviado_a: email,
          estado: 'fallido',
          error_mensaje: `Email enviado pero fallo actualización: ${updateError.message}`
        });
    } else {
      console.log('✅ Estado del canje actualizado correctamente');
      
      // 7. Registrar en logs de notificaciones
      await supabase
        .from('logs_notificaciones_canje')
        .insert({
          canje_id: canje_id,
          email_enviado_a: email,
          estado: 'exitoso',
          error_mensaje: null
        });
    }

    console.log('🎉 Proceso completado exitosamente');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email de notificación enviado exitosamente',
        email: email,
        canje_id: canje_id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Error en notificar-error-canje:', error);
    
    // Intentar registrar el error en logs si es posible
    try {
      const { canje_id } = await req.json();
      if (canje_id) {
        await supabase
          .from('logs_notificaciones_canje')
          .insert({
            canje_id: canje_id,
            email_enviado_a: null,
            estado: 'fallido',
            error_mensaje: error.message || 'Error desconocido'
          });
      }
    } catch (logError) {
      console.error('No se pudo registrar error en logs:', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
