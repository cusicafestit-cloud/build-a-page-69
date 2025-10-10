import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, CheckCircle2, AlertCircle, Loader2, Ticket, Calendar, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import P5Background from "@/components/P5Background";
import confetti from "canvas-confetti";
import { Skeleton } from "@/components/ui/skeleton";
import { FormSkeleton, ListSkeleton } from "@/components/ui/skeleton-components";

// Tipos de datos usando Supabase types
type AttendeeData = Tables<'asistentes'>;
type CanjeData = Tables<'canjes'>;
type EventData = Tables<'eventos'>;
type TicketTypeData = Tables<'tipos_tickets'>;

const TicketExchange = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<'email' | 'loading' | 'canjes' | 'confirming' | 'success' | 'error'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [attendeeData, setAttendeeData] = useState<AttendeeData | null>(null);
  const [availableCanjes, setAvailableCanjes] = useState<CanjeData[]>([]);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [ticketTypeData, setTicketTypeData] = useState<TicketTypeData | null>(null);
  const [selectedCanje, setSelectedCanje] = useState<CanjeData | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Función para lanzar confeti
  const launchConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  // Validar email y buscar asistente
  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresa tu correo electrónico",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setStep('loading');

    try {
      // Buscar asistente por email
      const { data: attendee, error: attendeeError } = await supabase
        .from('asistentes')
        .select('*')
        .eq('email', email.trim())
        .single();

      if (attendeeError || !attendee) {
        setStep('error');
        toast({
          title: "Email no encontrado",
          description: "No encontramos ningún registro con este correo electrónico",
          variant: "destructive",
        });
        return;
      }

      setAttendeeData(attendee);

      // Buscar canjes disponibles para este asistente
      // Solo mostrar canjes donde ambos eventos tengan canjes habilitados
      const { data: canjes, error: canjesError } = await supabase
        .from('canjes')
        .select(`
          *,
          evento_original:eventos!evento_original_id(*),
          evento_destino:eventos!evento_destino_id(*),
          tipo_ticket_original:tipos_tickets!tipo_ticket_original_id(*),
          tipo_ticket_destino:tipos_tickets!tipo_ticket_destino_id(*)
        `)
        .eq('asistente_id', attendee.id)
        .eq('estado', 'disponible');

      if (canjesError) {
        console.error('Error fetching canjes:', canjesError);
        setStep('error');
        return;
      }

      // Filtrar canjes donde ambos eventos tengan canjes habilitados
      const canjesHabilitados = canjes?.filter((canje: any) => {
        const eventoOriginalHabilitado = canje.evento_original?.canjes_habilitados === true;
        const eventoDestinoHabilitado = canje.evento_destino?.canjes_habilitados === true;
        return eventoOriginalHabilitado && eventoDestinoHabilitado;
      }) || [];

      if (canjesHabilitados.length === 0) {
        setStep('error');
        toast({
          title: "Sin canjes disponibles",
          description: "No tienes canjes disponibles en este momento. Los eventos deben tener canjes habilitados.",
          variant: "destructive",
        });
        return;
      }

      setAvailableCanjes(canjesHabilitados);
      setStep('canjes');

    } catch (error) {
      console.error('Error:', error);
      setStep('error');
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar tu solicitud",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Confirmar canje
  const handleConfirmCanje = async (canje: any) => {
    setSelectedCanje(canje);
    setConfirming(true);

    try {
      // Actualizar estado del canje a "esperando_tp"
      const { error } = await supabase
        .from('canjes')
        .update({
          estado: 'esperando_tp',
          fecha_procesado: new Date().toISOString(),
        })
        .eq('id', canje.id);

      if (error) {
        console.error('Error updating canje:', error);
        toast({
          title: "Error",
          description: "No se pudo procesar el canje",
          variant: "destructive",
        });
        return;
      }

      // Lanzar confeti y mostrar éxito
      setTimeout(() => {
        launchConfetti();
        setStep('success');
        toast({
          title: "¡Canje exitoso!",
          description: "Tu solicitud de canje ha sido procesada correctamente",
        });
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar el canje",
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
    }
  };

  // Reiniciar formulario
  const handleReset = () => {
    setStep('email');
    setEmail('');
    setAttendeeData(null);
    setAvailableCanjes([]);
    setEventData(null);
    setTicketTypeData(null);
    setSelectedCanje(null);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Fondo animado P5.js */}
      <P5Background />
      
      {/* Contenido principal */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          
          {/* Header minimalista */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-light text-white tracking-wide mb-2">
              CUSICA
            </h1>
            <p className="text-white/60 text-sm font-light">
              Canjea tu Ticket o Promo Code
            </p>
          </div>

          {/* Paso 1: Ingreso de email */}
          {step === 'email' && (
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Ingresa el e-mail con el cual recibiste tus tickets que 
                    aún no hayan sido reembolsados o recibiste tu 
                    Promo Code para optar al canje de los mismos.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="email" className="text-gray-700 font-medium">
                      Correo Electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Ingresa el e-mail con el que compraste tu entrada"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2 bg-yellow-50 border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400/20"
                      onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
                    />
                  </div>

                  <div className="flex items-start space-x-2 text-xs text-gray-500">
                    <input 
                      type="checkbox" 
                      id="terms-checkbox"
                      className="mt-0.5" 
                      defaultChecked 
                      title="Acepto términos y condiciones"
                    />
                    <label htmlFor="terms-checkbox">
                      Acepto los{" "}
                      <span className="text-red-500 underline cursor-pointer">
                        términos y condiciones
                      </span>{" "}
                      y autorizo el procesamiento de mis datos personales
                    </label>
                  </div>

                  <Button
                    onClick={handleEmailSubmit}
                    disabled={!email.trim()}
                    className="w-full bg-red-300 hover:bg-red-400 text-gray-800 font-medium py-3 rounded-lg transition-all duration-200"
                  >
                    Continuar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Paso 2: Cargando */}
          {step === 'loading' && (
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Verificando información
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Estamos buscando tus canjes disponibles...
                  </p>
                </div>
                
                {/* Skeleton de información de usuario */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                
                {/* Skeleton de lista de canjes */}
                <ListSkeleton items={3} />
              </CardContent>
            </Card>
          )}

          {/* Paso 3: Mostrar canjes disponibles */}
          {step === 'canjes' && (
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Ticket className="w-5 h-5" />
                  Canjes Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  {/* Información del usuario */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {attendeeData?.nombre}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{email}</span>
                    </div>
                  </div>

                  {/* Lista de canjes */}
                  {availableCanjes.map((canje: any) => (
                    <div key={canje.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-800">
                            {canje.evento_original?.nombre} → {canje.evento_destino?.nombre}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {canje.cantidad || 1} ticket{(canje.cantidad || 1) > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">De:</span>
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{backgroundColor: canje.tipo_ticket_original?.color || '#6B7280'}}
                          />
                          <span className="text-sm text-gray-600">
                            {canje.tipo_ticket_original?.tipo}
                          </span>
                          {canje.tipo_ticket_original?.tp_id && (
                            <Badge variant="outline" className="text-xs">
                              {canje.tipo_ticket_original.tp_id}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">A:</span>
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{backgroundColor: canje.tipo_ticket_destino?.color || '#6B7280'}}
                          />
                          <span className="text-sm text-gray-600">
                            {canje.tipo_ticket_destino?.tipo}
                          </span>
                          {canje.tipo_ticket_destino?.tp_id && (
                            <Badge variant="outline" className="text-xs">
                              {canje.tipo_ticket_destino.tp_id}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {canje.motivo && (
                        <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                          <strong>Motivo:</strong> {canje.motivo}
                        </div>
                      )}

                      <Button
                        onClick={() => handleConfirmCanje(canje)}
                        disabled={confirming}
                        className="w-full bg-green-500 hover:bg-green-600 text-white"
                      >
                        {confirming ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          'Confirmar Canje'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Paso 4: Éxito */}
          {step === 'success' && (
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-4">
                  ¡Canje Exitoso!
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Tu solicitud de canje ha sido creada exitosamente. 
                  Te enviaremos un correo con los datos del canje.
                </p>
                
                {selectedCanje && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <h4 className="font-medium text-gray-800 mb-2">Detalles del canje:</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Cantidad:</strong> {selectedCanje.cantidad || 1} ticket{(selectedCanje.cantidad || 1) > 1 ? 's' : ''}</p>
                      <p><strong>Estado:</strong> Esperando TP</p>
                      {selectedCanje.motivo && (
                        <p><strong>Motivo:</strong> {selectedCanje.motivo}</p>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                >
                  Realizar Otro Canje
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Paso 5: Error */}
          {step === 'error' && (
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-4">
                  No se encontraron canjes
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  No encontramos canjes disponibles para este correo electrónico.
                  Verifica que sea el correo correcto o contacta a soporte.
                </p>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleReset}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Intentar de Nuevo
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open('https://wa.me/584122097456', '_blank')}
                  >
                    Contactar Soporte
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-white/40 text-xs">
              © 2025 Cusica. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketExchange;
