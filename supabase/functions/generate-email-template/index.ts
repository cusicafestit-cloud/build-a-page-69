import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, currentHtml, bannerImage } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "El prompt es requerido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = `Eres un experto diseñador de plantillas de email HTML. Tu trabajo es generar código HTML completo y profesional para emails marketing.

IMPORTANTE:
- Genera código HTML completo incluyendo <!DOCTYPE html>, <html>, <head>, y <body>
- Usa tablas HTML para el diseño (no CSS Grid/Flexbox, ya que muchos clientes de email no los soportan bien)
- Incluye estilos inline (no uses clases CSS externas)
- Usa colores modernos y atractivos
- Asegúrate de que el diseño sea responsive con media queries
- Incluye padding y spacing adecuados
- Usa fuentes web-safe o fuentes de Google Fonts con fallbacks
- El diseño debe verse bien en clientes de email como Gmail, Outlook, Apple Mail
- Si el usuario menciona un banner o imagen principal, usa EXACTAMENTE este placeholder: src="{{BANNER_IMAGE}}" para la imagen del banner

Variables disponibles que el usuario puede usar:
- {{nombre}} - Nombre del destinatario
- {{evento}} - Nombre del evento
- {{fecha}} - Fecha del evento
- {{lugar}} - Lugar del evento
- {{precio}} - Precio del ticket
- {{codigo_ticket}} - Código del ticket
- {{tipo_ticket}} - Tipo de ticket
- {{email}} - Email del destinatario

${currentHtml ? `\n\nHTML ACTUAL:\n${currentHtml}\n\nModifica o mejora el HTML actual según el prompt del usuario.` : ''}

Devuelve SOLO el código HTML, sin explicaciones adicionales.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Por favor intenta de nuevo más tarde." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Fondos insuficientes. Por favor recarga tu cuenta de Lovable AI." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let generatedHtml = data.choices[0].message.content;

    // Limpiar el HTML si viene envuelto en bloques de código markdown
    if (generatedHtml.includes("```html")) {
      generatedHtml = generatedHtml.replace(/```html\n?/g, "").replace(/```\n?/g, "");
    }

    // Reemplazar el placeholder con la imagen real si se proporcionó
    if (bannerImage && generatedHtml.includes("{{BANNER_IMAGE}}")) {
      generatedHtml = generatedHtml.replace(/\{\{BANNER_IMAGE\}\}/g, bannerImage);
    }

    return new Response(
      JSON.stringify({ html: generatedHtml }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-email-template function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
