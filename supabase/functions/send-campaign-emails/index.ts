import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

// Función para enviar email usando Resend API directamente
async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Cusica <onboarding@resend.dev>',
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_id } = await req.json();

    if (!campaign_id) {
      throw new Error('campaign_id es requerido');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Enviando emails para campaña:', campaign_id);

    // Obtener la campaña
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campanas_email')
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (campaignError) {
      throw new Error(`Error obteniendo campaña: ${campaignError.message}`);
    }

    console.log('Campaña encontrada:', campaign.nombre);

    // Obtener todos los envíos pendientes
    const { data: envios, error: enviosError } = await supabaseClient
      .from('envios_email')
      .select('*')
      .eq('campana_id', campaign_id)
      .eq('estado', 'enviado');

    if (enviosError) {
      throw new Error(`Error obteniendo envíos: ${enviosError.message}`);
    }

    console.log(`Enviando ${envios?.length || 0} emails`);

    let enviados = 0;
    let errores = 0;

    // Enviar emails en lotes pequeños para evitar rate limits
    for (const envio of envios || []) {
      try {
        await sendEmail(
          envio.email_destinatario,
          campaign.asunto,
          campaign.contenido_html
        );

        console.log('Email enviado a:', envio.email_destinatario);
        
        // Actualizar fecha de entrega
        await supabaseClient
          .from('envios_email')
          .update({
            fecha_entrega: new Date().toISOString()
          })
          .eq('id', envio.id);
        
        enviados++;
      } catch (error: any) {
        console.error('Error enviando a', envio.email_destinatario, ':', error.message);
        
        // Actualizar estado a rebotado
        await supabaseClient
          .from('envios_email')
          .update({
            estado: 'rebotado',
            motivo_rebote: error.message,
            fecha_rebote: new Date().toISOString()
          })
          .eq('id', envio.id);
        
        errores++;
      }
    }

    // Actualizar estado de la campaña
    await supabaseClient
      .from('campanas_email')
      .update({
        estado: 'enviada',
        fecha_enviada: new Date().toISOString()
      })
      .eq('id', campaign_id);

    console.log(`Proceso completado: ${enviados} enviados, ${errores} errores`);

    return new Response(
      JSON.stringify({
        success: true,
        enviados,
        errores,
        total: envios?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error en send-campaign-emails:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
