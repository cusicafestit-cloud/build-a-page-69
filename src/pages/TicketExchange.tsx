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
  const {
    toast
  } = useToast();
  const [step, setStep] = useState<'email' | 'loading' | 'canjes' | 'tickets' | 'select-event' | 'confirming' | 'success' | 'error'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [attendeeData, setAttendeeData] = useState<AttendeeData | null>(null);
  const [availableCanjes, setAvailableCanjes] = useState<CanjeData[]>([]);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [availableEvents, setAvailableEvents] = useState<EventData[]>([]);
  const [selectedTargetEvent, setSelectedTargetEvent] = useState<EventData | null>(null);
  const [processedCanjes, setProcessedCanjes] = useState<any[]>([]);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [ticketTypeData, setTicketTypeData] = useState<TicketTypeData | null>(null);
  const [selectedCanje, setSelectedCanje] = useState<CanjeData | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Función para lanzar confeti
  const launchConfetti = () => {
    const count = 200;
    const defaults = {
      origin: {
        y: 0.7
      }
    };
    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }
    fire(0.25, {
      spread: 26,
      startVelocity: 55
    });
    fire(0.2, {
      spread: 60
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45
    });
  };

  // Validar email y buscar asistente
  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresa tu correo electrónico",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    setStep('loading');
    try {
      // Buscar asistente por email
      const {
        data: attendee,
        error: attendeeError
      } = await supabase.from('asistentes').select('*').eq('email', email.trim()).single();
      if (attendeeError || !attendee) {
        setStep('error');
        toast({
          title: "Email no encontrado",
          description: "No encontramos ningún registro con este correo electrónico",
          variant: "destructive"
        });
        return;
      }
      setAttendeeData(attendee);

      // Buscar tickets del usuario (asistencias)
      const {
        data: asistencias,
        error: asistenciasError
      } = await supabase
        .from('asistencias')
        .select(`
          *,
          evento:eventos(*),
          tipo_ticket:tipos_tickets(*)
        `)
        .eq('asistente_id', attendee.id)
        .eq('estado', 'confirmado');

      if (asistenciasError) {
        console.error('Error fetching asistencias:', asistenciasError);
        setStep('error');
        return;
      }

      // Filtrar solo tickets de eventos con canjes habilitados
      const ticketsCanjeables = (asistencias || []).filter((asistencia: any) => 
        asistencia.evento?.canjes_habilitados === true
      );

      if (ticketsCanjeables.length === 0) {
        setStep('error');
        toast({
          title: "Sin canjes disponibles",
          description: "No tienes canjes disponibles en este momento. Los eventos deben tener canjes habilitados.",
          variant: "destructive"
        });
        return;
      }

      setUserTickets(ticketsCanjeables);
      setStep('tickets');
    } catch (error) {
      console.error('Error:', error);
      setStep('error');
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar tu solicitud",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Seleccionar ticket para canje
  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setLoading(true);

    try {
      // Buscar eventos disponibles para canjear (diferentes al evento original y con canjes habilitados)
      const { data: eventos, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('canjes_habilitados', true)
        .neq('id', ticket.evento_id)
        .order('fecha', { ascending: true });

      if (error) throw error;

      if (!eventos || eventos.length === 0) {
        toast({
          title: "Sin eventos disponibles",
          description: "No hay eventos disponibles para canjear en este momento",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      setAvailableEvents(eventos);
      setStep('select-event');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al buscar eventos disponibles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear solicitud de canje
  const handleCreateExchange = async () => {
    if (!selectedTicket || !selectedTargetEvent || !attendeeData) {
      toast({
        title: "Error",
        description: "Faltan datos para crear el canje",
        variant: "destructive"
      });
      return;
    }

    setConfirming(true);

    try {
      // Verificar límite de canjes
      const maximoCanjes = selectedTicket.tipo_ticket?.maximo_canjes || 0;
      
      if (maximoCanjes > 0) {
        const { count: canjesUsados, error: countError } = await supabase
          .from('canjes')
          .select('*', { count: 'exact', head: true })
          .eq('tipo_ticket_original_id', selectedTicket.tipo_ticket_id)
          .in('estado', ['pendiente', 'aprobado', 'canjeado']);

        if (countError) throw countError;

        if ((canjesUsados || 0) >= maximoCanjes) {
          toast({
            title: "Límite alcanzado",
            description: `Este tipo de ticket ha alcanzado el límite máximo de ${maximoCanjes} canje(s)`,
            variant: "destructive"
          });
          setConfirming(false);
          return;
        }
      }

      // Crear el canje
      const { data: canje, error } = await supabase
        .from('canjes')
        .insert({
          asistente_id: attendeeData.id,
          nombre_asistente: attendeeData.nombre || '',
          apellido_asistente: attendeeData.apellido || '',
          correo: attendeeData.email,
          evento_original_id: selectedTicket.evento_id,
          tipo_ticket_original_id: selectedTicket.tipo_ticket_id,
          cantidad: 1,
          estado: 'pendiente',
          evento_tp_id: selectedTicket.evento?.tp_id,
          ticket_tp_id: selectedTicket.tipo_ticket?.tp_id,
          // Información del evento destino
          evento_destino_id: selectedTargetEvent.id,
          evento_destino_nombre: selectedTargetEvent.nombre,
          evento_destino_tp_id: selectedTargetEvent.tp_id,
          // Los campos del tipo de ticket destino se dejarán null ya que no se seleccionan en este flujo
          tipo_ticket_destino_id: null,
          tipo_ticket_destino_nombre: null,
          tipo_ticket_destino_tp_id: null
        })
        .select()
        .single();

      if (error) throw error;

      // Lanzar confeti y mostrar éxito
      setTimeout(() => {
        launchConfetti();
        setStep('success');
        toast({
          title: "¡Solicitud enviada!",
          description: "Tu solicitud de canje ha sido recibida y será procesada por nuestro equipo"
        });
      }, 500);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la solicitud de canje",
        variant: "destructive"
      });
    } finally {
      setConfirming(false);
    }
  };

  // Confirmar todos los canjes
  const handleConfirmAllCanjes = async () => {
    setConfirming(true);
    try {
      // Validar nuevamente los límites antes de procesar
      const canjesAValidar = [];
      const canjesRechazados = [];
      for (const canje of availableCanjes) {
        const tipoTicket = (canje as any).tipo_ticket_original;
        const maximoCanjes = tipoTicket?.maximo_canjes || 0;

        // Si maximo_canjes es 0, significa ilimitado
        if (maximoCanjes === 0) {
          canjesAValidar.push(canje);
          continue;
        }

        // Contar cuántos canjes ya se han procesado para este tipo de ticket
        const {
          count: canjesUsados,
          error: countError
        } = await supabase.from('canjes').select('*', {
          count: 'exact',
          head: true
        }).eq('tipo_ticket_original_id', (canje as any).tipo_ticket_original_id).eq('estado', 'canjeado');
        if (countError) {
          console.error('Error counting canjes:', countError);
          canjesRechazados.push(canje);
          continue;
        }

        // Verificar si se alcanzó el límite
        if ((canjesUsados || 0) >= maximoCanjes) {
          canjesRechazados.push(canje);
          toast({
            title: "Límite alcanzado",
            description: `El tipo de ticket "${tipoTicket?.tipo}" ha alcanzado el límite máximo de ${maximoCanjes} canje(s)`,
            variant: "destructive"
          });
        } else {
          canjesAValidar.push(canje);
        }
      }
      if (canjesRechazados.length > 0 && canjesAValidar.length === 0) {
        toast({
          title: "No se pueden procesar los canjes",
          description: "Todos los canjes han alcanzado su límite máximo",
          variant: "destructive"
        });
        setConfirming(false);
        return;
      }

      // Guardar información de los canjes antes de actualizarlos
      setProcessedCanjes(canjesAValidar);

      // Actualizar estado de los canjes validados a "canjeado"
      const canjeIds = canjesAValidar.map(canje => canje.id);
      const {
        error
      } = await supabase.from('canjes').update({
        estado: 'canjeado',
        fecha_procesado: new Date().toISOString()
      }).in('id', canjeIds);
      if (error) {
        console.error('Error updating canjes:', error);
        toast({
          title: "Error",
          description: "No se pudo procesar los canjes",
          variant: "destructive"
        });
        setConfirming(false);
        return;
      }

      // Lanzar confeti y mostrar éxito
      setTimeout(() => {
        launchConfetti();
        setStep('success');
        toast({
          title: "¡Canjes exitosos!",
          description: canjesAValidar.length === availableCanjes.length ? "Tus solicitudes de canje han sido procesadas correctamente" : `Se procesaron ${canjesAValidar.length} de ${availableCanjes.length} canjes exitosamente`
        });
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar los canjes",
        variant: "destructive"
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
    setUserTickets([]);
    setSelectedTicket(null);
    setAvailableEvents([]);
    setSelectedTargetEvent(null);
    setEventData(null);
    setTicketTypeData(null);
    setSelectedCanje(null);
  };
  return <div className="min-h-screen bg-black relative overflow-hidden">
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
          {step === 'email' && <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
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
                    <Input id="email" type="email" placeholder="Ingresa el e-mail con el que compraste tu entrada" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 bg-yellow-50 border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400/20" onKeyPress={e => e.key === 'Enter' && handleEmailSubmit()} />
                  </div>

                  <div className="flex items-start space-x-2 text-xs text-gray-500">
                    <input type="checkbox" id="terms-checkbox" className="mt-0.5" defaultChecked title="Acepto términos y condiciones" />
                    <label htmlFor="terms-checkbox">
                      Acepto los{" "}
                      <span className="text-red-500 underline cursor-pointer">
                        términos y condiciones
                      </span>{" "}
                      y autorizo el procesamiento de mis datos personales
                    </label>
                  </div>

                  <Button onClick={handleEmailSubmit} disabled={!email.trim()} className="w-full bg-red-300 hover:bg-red-400 text-gray-800 font-medium py-3 rounded-lg transition-all duration-200">
                    Continuar
                  </Button>
                </div>
              </CardContent>
            </Card>}

          {/* Paso 2: Cargando */}
          {step === 'loading' && <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Verificando información
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Estamos buscando tus tickets disponibles...
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
                
                {/* Skeleton de lista de tickets */}
                <ListSkeleton items={3} />
              </CardContent>
            </Card>}

          {/* Paso 3: Seleccionar Ticket */}
          {step === 'tickets' && <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Ticket className="w-5 h-5" />
                  Tus Tickets
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

                  <p className="text-sm text-gray-600">
                    Selecciona el ticket que deseas canjear:
                  </p>

                  {/* Lista de tickets */}
                  {userTickets.map((ticket: any) => (
                    <div 
                      key={ticket.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer hover:border-green-300"
                      onClick={() => handleSelectTicket(ticket)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-800">
                            {ticket.evento?.nombre}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {ticket.tipo_ticket?.tipo}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                            style={{ backgroundColor: ticket.tipo_ticket?.color || '#6B7280' }}
                          >
                            Código: {ticket.codigo_ticket}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button 
                    variant="outline" 
                    onClick={handleReset} 
                    className="w-full mt-4"
                  >
                    Volver
                  </Button>
                </div>
              </CardContent>
            </Card>}

          {/* Paso 4: Seleccionar Evento Destino */}
          {step === 'select-event' && <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Calendar className="w-5 h-5" />
                  Selecciona el Evento Destino
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  {/* Ticket seleccionado */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs text-green-700 mb-2 font-medium">Ticket a Canjear:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {selectedTicket?.evento?.nombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-700">
                          {selectedTicket?.tipo_ticket?.tipo}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">
                    Selecciona el evento al cual deseas canjear:
                  </p>

                  {/* Lista de eventos disponibles */}
                  {availableEvents.map((event: any) => (
                    <div 
                      key={event.id} 
                      className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                        selectedTargetEvent?.id === event.id 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'hover:bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTargetEvent(event)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">
                            {event.nombre}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {new Date(event.fecha).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setStep('tickets')} 
                      className="w-full"
                    >
                      Volver
                    </Button>
                    <Button 
                      onClick={handleCreateExchange}
                      disabled={!selectedTargetEvent || confirming}
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                    >
                      {confirming ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        'Solicitar Canje'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>}

          {/* Paso 5: Mostrar canjes disponibles (flujo anterior) */}
          {step === 'canjes' && <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
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
                  {availableCanjes.map((canje: any) => <div key={canje.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-800">
                            {canje.evento_original?.nombre}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {canje.tipo_ticket_original?.tipo}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {canje.cantidad || 1} ticket{(canje.cantidad || 1) > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    </div>)}

                  {/* Botón para confirmar todos */}
                  <Button onClick={() => handleConfirmAllCanjes()} disabled={confirming} className="w-full bg-green-500 hover:bg-green-600 text-white mt-4">
                    {confirming ? <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </> : 'Confirmar Todos los Canjes'}
                  </Button>
                </div>
              </CardContent>
            </Card>}

          {/* Paso 4: Éxito */}
          {step === 'success' && <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-4">¡Solicitud de Canje Recibida!</h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Tu solicitud de canje ha sido recibida, te enviaremos un correo electrónico con toda la información de tu canje.
                </p>
                
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 mb-6 text-left border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800 text-base">Resumen de Solicitud</h4>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      En Proceso
                    </Badge>
                  </div>
                  
                  {/* Ticket Original */}
                  {selectedTicket && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Ticket a Canjear
                      </p>
                      <div className="bg-white rounded-md p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-800 text-sm">
                            {selectedTicket.evento?.nombre}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {selectedTicket.tipo_ticket?.tipo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ 
                              backgroundColor: `${selectedTicket.tipo_ticket?.color}20`,
                              borderColor: selectedTicket.tipo_ticket?.color 
                            }}
                          >
                            {selectedTicket.codigo_ticket}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Evento Destino */}
                  {selectedTargetEvent && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Nuevo Evento
                      </p>
                      <div className="bg-white rounded-md p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-gray-800 text-sm">
                            {selectedTargetEvent.nombre}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {new Date(selectedTargetEvent.fecha).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Información adicional */}
                  <div className="bg-blue-50 rounded-md p-3 mt-4 border border-blue-200">
                    <p className="text-xs text-blue-800 leading-relaxed">
                      <strong>Próximos pasos:</strong> Nuestro equipo revisará tu solicitud y te contactará 
                      por correo electrónico en las próximas 24-48 horas con los detalles de tu nuevo ticket.
                    </p>
                  </div>
                </div>

                <Button onClick={handleReset} variant="outline" className="w-full">
                  Realizar Otro Canje
                </Button>
              </CardContent>
            </Card>}

          {/* Paso 5: Error */}
          {step === 'error' && <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
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
                  <Button onClick={handleReset} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                    Intentar de Nuevo
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => window.open('https://wa.me/584122097456', '_blank')}>
                    Contactar Soporte
                  </Button>
                </div>
              </CardContent>
            </Card>}

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-white/40 text-xs">
              © 2025 Cusica. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default TicketExchange;