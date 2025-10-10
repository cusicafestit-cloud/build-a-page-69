import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Ticket, Eye } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  EventCardSkeleton, 
  TableSkeleton, 
  FormSkeleton, 
  SelectSkeleton,
  CardGridSkeleton 
} from "@/components/ui/skeleton-components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Event = {
  id: string;
  name: string;
  date: string;
  status: string;
  enabled_for_exchanges: boolean;
  tp_id?: string;
  ticketTypes: Array<{ id: string; type: string; color: string }>;
};

type EventTicketConfig = {
  ticketTypeId: string;
  ticketTypeName: string;
  color: string;
  quantity: number;
  tp_id?: string;
};

const Events = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEventSummaryOpen, setIsEventSummaryOpen] = useState(false);
  const [summaryEvent, setSummaryEvent] = useState<Event | null>(null);
  const [isDeleteEventDialogOpen, setIsDeleteEventDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const [newEvent, setNewEvent] = useState({
    name: "",
    capacity: "",
    tp_id: "",
    ticketTypes: [] as Array<{ type: string; color: string }>,
    enabledForExchanges: false,
    ticketConfigs: [] as EventTicketConfig[],
  });

  // Estado para CRUD de Tipos de Tickets
  type TicketTypeItem = { id: string; eventId: string; eventName: string; type: string; color: string; tp_id?: string; maximo_canjes?: number; precio?: number; capacidad?: number };
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isEditTicketOpen, setIsEditTicketOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketTypeItem | null>(null);
  const [newTicket, setNewTicket] = useState<TicketTypeItem>({ id: "", eventId: "", eventName: "", type: "", color: "#6B7280", tp_id: "", maximo_canjes: 0, precio: 0, capacidad: 100 });


  // Fetch events from Supabase
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('id, nombre, fecha, estado, tp_id, canjes_habilitados')
        .order('fecha', { ascending: true });
      
      if (error) throw error;
      
      // Transform data to match Event type
      return data.map(event => ({
        id: event.id,
        name: event.nombre,
        date: event.fecha,
        status: event.estado,
        enabled_for_exchanges: event.canjes_habilitados || false,
        tp_id: event.tp_id,
        ticketTypes: [] // Will be populated separately
      }));
    },
  });

  // Fetch all ticket types from Supabase
  const { data: ticketTypes = [], isLoading: isLoadingTicketTypes } = useQuery({
    queryKey: ["ticket_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_tickets')
        .select(`
          id,
          tipo,
          color,
          tp_id,
          maximo_canjes,
          evento_id,
          eventos(nombre)
        `)
        .order('tipo');
      
      if (error) throw error;
      
      // Transform data to match TicketTypeItem type
      return data.map(ticket => ({
        id: ticket.id,
        eventId: ticket.evento_id || "",
        eventName: ticket.eventos?.nombre || "",
        type: ticket.tipo,
        color: ticket.color,
        tp_id: ticket.tp_id,
        maximo_canjes: ticket.maximo_canjes
      }));
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      // Validar campos requeridos
      if (!eventData.name) {
        throw new Error("El nombre del evento es requerido");
      }
      if (!eventData.capacity) {
        throw new Error("La capacidad del evento es requerida");
      }

      const { data, error } = await supabase
        .from('eventos')
        .insert({
          nombre: eventData.name,
          fecha: new Date().toISOString().split('T')[0], // Default to today
          lugar: eventData.venue || 'Por definir', // Campo requerido
          capacidad: parseInt(eventData.capacity) || 0,
          precio: 0, // Campo requerido - precio por defecto
          estado: 'proximo', // Usar el valor por defecto de la BD
          tp_id: eventData.tp_id || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Evento creado",
        description: `El evento "${newEvent.name}" ha sido creado exitosamente.`,
      });
      setIsNewEventOpen(false);
      setNewEvent({
        name: "",
        capacity: "",
        tp_id: "",
        ticketTypes: [],
        enabledForExchanges: false,
        ticketConfigs: [],
      });
    },
    onError: (error: any) => {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el evento. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleCreateEvent = () => {
    createEventMutation.mutate(newEvent);
  };

  // Funciones para gestionar configuración de tickets en nuevo evento
  const handleAddTicketConfig = (ticketTypeId: string) => {
    const ticketType = ticketTypes.find(t => t.id === ticketTypeId);
    if (!ticketType) return;

    const newConfig: EventTicketConfig = {
      ticketTypeId: ticketType.id,
      ticketTypeName: ticketType.type,
      color: ticketType.color,
      quantity: 100, // Cantidad por defecto
      tp_id: ticketType.tp_id,
    };

    setNewEvent({
      ...newEvent,
      ticketConfigs: [...newEvent.ticketConfigs, newConfig]
    });
  };

  const handleRemoveTicketConfig = (ticketTypeId: string) => {
    setNewEvent({
      ...newEvent,
      ticketConfigs: newEvent.ticketConfigs.filter(config => config.ticketTypeId !== ticketTypeId)
    });
  };

  const handleUpdateTicketQuantity = (ticketTypeId: string, quantity: number) => {
    setNewEvent({
      ...newEvent,
      ticketConfigs: newEvent.ticketConfigs.map(config => 
        config.ticketTypeId === ticketTypeId 
          ? { ...config, quantity: Math.max(0, quantity) }
          : config
      )
    });
  };

  // Obtener tipos de tickets disponibles para agregar (no ya configurados)
  const getAvailableTicketTypesForEvent = () => {
    const configuredIds = newEvent.ticketConfigs.map(config => config.ticketTypeId);
    return ticketTypes.filter(ticket => !configuredIds.includes(ticket.id));
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsEditEventOpen(true);
  };

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (eventData: Event) => {
      const { data, error } = await supabase
        .from('eventos')
        .update({
          nombre: eventData.name,
          fecha: eventData.date,
          estado: eventData.status,
          tp_id: eventData.tp_id || null
        })
        .eq('id', eventData.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Evento actualizado",
        description: `El evento "${editingEvent?.name}" ha sido actualizado exitosamente.`,
      });
      setIsEditEventOpen(false);
      setEditingEvent(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el evento. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateEvent = () => {
    if (editingEvent) {
      updateEventMutation.mutate(editingEvent);
    }
  };

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Evento eliminado",
        description: "El evento ha sido eliminado exitosamente.",
        variant: "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteEvent = (eventId: string) => {
    setEventToDelete(eventId);
    setIsDeleteEventDialogOpen(true);
  };

  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete);
      setIsDeleteEventDialogOpen(false);
      setEventToDelete(null);
    }
  };

  // Toggle exchanges enabled mutation
  const toggleExchangesMutation = useMutation({
    mutationFn: async ({ eventId, enabled }: { eventId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('eventos')
        .update({ canjes_habilitados: enabled })
        .eq('id', eventId);
      
      if (error) throw error;
      
      toast({
        title: enabled ? "Canjes habilitados" : "Canjes deshabilitados",
        description: `Los canjes han sido ${enabled ? 'habilitados' : 'deshabilitados'} para este evento.`,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración de canjes.",
        variant: "destructive",
      });
    },
  });

  const handleToggleExchanges = (eventId: string, enabled: boolean) => {
    toggleExchangesMutation.mutate({ eventId, enabled });
  };

  const handleViewEventSummary = (event: Event) => {
    setSummaryEvent(event);
    setIsEventSummaryOpen(true);
  };

  // Create ticket type mutation
  const createTicketTypeMutation = useMutation({
    mutationFn: async (ticketData: TicketTypeItem) => {
      // Validar campos requeridos
      if (!ticketData.type) {
        throw new Error("El nombre del tipo de ticket es requerido");
      }
      
      // Permitir crear tipos de tickets sin evento enlazado
      const eventoId = ticketData.eventId || null;

      const { data, error } = await supabase
        .from('tipos_tickets')
        .insert({
          tipo: ticketData.type,
          color: ticketData.color || "#6B7280",
          tp_id: ticketData.tp_id || null,
          maximo_canjes: ticketData.maximo_canjes || 0,
          evento_id: eventoId,
          precio: ticketData.precio || 0,
          capacidad: ticketData.capacidad || 100
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket_types"] });
      toast({
        title: "Tipo de ticket creado",
        description: `El tipo "${newTicket.type}" ha sido creado exitosamente.`,
      });
      setIsNewTicketOpen(false);
      setNewTicket({ id: "", eventId: "", eventName: "", type: "", color: "#6B7280", tp_id: "", maximo_canjes: 0, precio: 0, capacidad: 100 });
    },
    onError: (error: any) => {
      console.error("Error creating ticket type:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el tipo de ticket. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTicketType = () => {
    createTicketTypeMutation.mutate(newTicket);
  };

  const handleEditTicketType = (ticket: TicketTypeItem) => {
    setEditingTicket(ticket);
    setIsEditTicketOpen(true);
  };

  // Update ticket type mutation
  const updateTicketTypeMutation = useMutation({
    mutationFn: async (ticketData: TicketTypeItem) => {
      const { data, error } = await supabase
        .from('tipos_tickets')
        .update({
          tipo: ticketData.type,
          color: ticketData.color,
          tp_id: ticketData.tp_id || null,
          maximo_canjes: ticketData.maximo_canjes || 0,
          evento_id: ticketData.eventId || null,
          precio: ticketData.precio || 0,
          capacidad: ticketData.capacidad || 100
        })
        .eq('id', ticketData.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket_types"] });
      toast({
        title: "Tipo de ticket actualizado",
        description: `El tipo "${editingTicket?.type}" ha sido actualizado exitosamente.`,
      });
      setIsEditTicketOpen(false);
      setEditingTicket(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el tipo de ticket. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateTicketType = () => {
    if (editingTicket) {
      updateTicketTypeMutation.mutate(editingTicket);
    }
  };

  // Obtener tipos de tickets disponibles (no enlazados a ningún evento)
  const getAvailableTicketTypes = () => {
    return ticketTypes.filter(ticket => !ticket.eventId || ticket.eventId === "");
  };

  // Obtener tipos de tickets del evento actual
  const getEventTicketTypes = (eventId: string) => {
    return ticketTypes.filter(ticket => ticket.eventId === eventId);
  };

  // Link ticket to event mutation
  const linkTicketMutation = useMutation({
    mutationFn: async ({ ticketId, eventId }: { ticketId: string; eventId: string }) => {
      const { data, error } = await supabase
        .from('tipos_tickets')
        .update({ evento_id: eventId })
        .eq('id', ticketId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket_types"] });
      toast({
        title: "Ticket enlazado",
        description: "El tipo de ticket ha sido enlazado al evento exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo enlazar el ticket al evento. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleLinkTicketToEvent = (ticketId: string, eventId: string) => {
    linkTicketMutation.mutate({ ticketId, eventId });
  };

  // Unlink ticket from event mutation
  const unlinkTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const { data, error } = await supabase
        .from('tipos_tickets')
        .update({ evento_id: null })
        .eq('id', ticketId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket_types"] });
      toast({
        title: "Ticket desenlazado",
        description: "El tipo de ticket ha sido desenlazado del evento.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo desenlazar el ticket del evento. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleUnlinkTicketFromEvent = (ticketId: string) => {
    unlinkTicketMutation.mutate(ticketId);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-none shadow-lg">
                <CardHeader>
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-[150px]" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Gestión de Eventos
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra todos tus eventos y tipos de tickets
            </p>
          </div>
          <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Evento</DialogTitle>
                <DialogDescription>
                  Completa los detalles del nuevo evento y configura los tipos de tickets.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Información Básica */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                    Información Básica
                  </h3>
                  
                  <div className="grid gap-4">
                    {/* Campo Nombre - Ancho completo */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nombre del Evento
                      </Label>
                      <Input
                        id="name"
                        value={newEvent.name}
                        onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                        className="w-full"
                        placeholder="Nombre del evento"
                      />
                    </div>
                    
                    {/* Campos Capacidad y TP ID en la misma fila */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="capacity" className="text-sm font-medium">
                          Capacidad
                        </Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={newEvent.capacity}
                          onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
                          className="w-full"
                          placeholder="Ej: 5000"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tp_id" className="text-sm font-medium">
                          TP ID
                        </Label>
                        <Input
                          id="tp_id"
                          value={newEvent.tp_id}
                          onChange={(e) => setNewEvent({ ...newEvent, tp_id: e.target.value })}
                          className="w-full"
                          placeholder="Ej: ROCK2025"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuración de Tickets */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2 flex-1">
                      Configuración de Tickets
                    </h3>
                    <Badge variant="secondary" className="ml-4">
                      {newEvent.ticketConfigs.length} configurados
                    </Badge>
                  </div>
                  
                  {/* Selector de Tipo de Ticket */}
                  {getAvailableTicketTypesForEvent().length > 0 && (
                    <div className="flex items-center gap-2">
                      <Select onValueChange={handleAddTicketConfig}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Agregar tipo de ticket" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableTicketTypesForEvent().map((ticket) => (
                            <SelectItem key={ticket.id} value={ticket.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: ticket.color }}
                                />
                                {ticket.type}
                                {ticket.tp_id && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    ({ticket.tp_id})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">
                        Selecciona un tipo de ticket para configurar
                      </span>
                    </div>
                  )}
                  
                  {/* Lista de Tickets Configurados */}
                  <div className="space-y-3">
                    {newEvent.ticketConfigs.map((config) => (
                      <Card key={config.ticketTypeId} className="border-none shadow-sm bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: config.color }}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{config.ticketTypeName}</span>
                                {config.tp_id && (
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {config.tp_id}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`quantity-${config.ticketTypeId}`} className="text-sm">
                                  Cantidad:
                                </Label>
                                <Input
                                  id={`quantity-${config.ticketTypeId}`}
                                  type="number"
                                  min="0"
                                  value={config.quantity}
                                  onChange={(e) => handleUpdateTicketQuantity(config.ticketTypeId, parseInt(e.target.value) || 0)}
                                  className="w-20 h-8"
                                />
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveTicketConfig(config.ticketTypeId)}
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {newEvent.ticketConfigs.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay tipos de tickets configurados</p>
                        <p className="text-xs">Selecciona un tipo de ticket arriba para comenzar</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Resumen */}
                  {newEvent.ticketConfigs.length > 0 && (
                    <div className="bg-primary/5 p-3 rounded-lg border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Total de tickets:</span>
                        <span className="font-bold">
                          {newEvent.ticketConfigs.reduce((sum, config) => sum + config.quantity, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateEvent}>Crear Evento</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="ticket-types">Tipos de Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-none shadow-lg">
                    <CardHeader>
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-[150px]" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                <Card key={event.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                      </div>
                      <Badge variant={event.status === "active" ? "default" : "secondary"}>
                        {event.status === "active" ? "Activo" : "Próximo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {event.tp_id && (
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-mono bg-muted px-2 py-1 rounded text-xs">
                            {event.tp_id}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Canjes habilitados</span>
                        <Switch 
                          checked={event.enabled_for_exchanges} 
                          onCheckedChange={(checked) => handleToggleExchanges(event.id, checked)}
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewEventSummary(event)}
                          title="Ver resumen del evento"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ticket-types" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Tipos de Tickets</h2>
              <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Ticket className="w-4 h-4 mr-2" />
                    Nuevo Tipo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Tipo de Ticket</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="ticket-type" className="text-right">
                        Nombre *
                      </Label>
                      <Input
                        id="ticket-type"
                        value={newTicket.type}
                        onChange={(e) => setNewTicket({ ...newTicket, type: e.target.value })}
                        className="col-span-3"
                        placeholder="Ej: General, VIP, Premium"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">
                        Color
                      </Label>
                      <div className="col-span-3">
                        <div className="flex flex-wrap gap-2">
                          {[
                            { color: "#6B7280", name: "Gris" },
                            { color: "#3B82F6", name: "Azul" },
                            { color: "#10B981", name: "Verde" },
                            { color: "#F59E0B", name: "Amarillo" },
                            { color: "#EF4444", name: "Rojo" },
                            { color: "#8B5CF6", name: "Púrpura" },
                            { color: "#06B6D4", name: "Cian" },
                            { color: "#84CC16", name: "Lima" },
                            { color: "#F97316", name: "Naranja" },
                            { color: "#EC4899", name: "Rosa" }
                          ].map(({ color, name }) => (
                            <button
                              key={color}
                              type="button"
                              title={`Seleccionar color ${name}`}
                              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                                newTicket.color === color 
                                  ? 'border-foreground shadow-lg' 
                                  : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setNewTicket({ ...newTicket, color })}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Seleccionado: <span className="font-mono">{newTicket.color}</span>
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="ticket-tp-id" className="text-right">
                        TP ID
                      </Label>
                      <Input
                        id="ticket-tp-id"
                        value={newTicket.tp_id || ""}
                        onChange={(e) => setNewTicket({ ...newTicket, tp_id: e.target.value })}
                        className="col-span-3"
                        placeholder="Ej: ROCK-GEN"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="ticket-maximo" className="text-right">
                        Máximo
                      </Label>
                      <div className="col-span-3 space-y-2">
                        <Input
                          id="ticket-maximo"
                          type="number"
                          min="0"
                          value={newTicket.maximo_canjes || 0}
                          onChange={(e) => setNewTicket({ ...newTicket, maximo_canjes: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                        <p className="text-xs text-muted-foreground">
                          Máximo número de canjes permitidos para este tipo de ticket. 
                          <br />
                          <strong>0 = Sin límite</strong> (canjes ilimitados)
                        </p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleCreateTicketType}
                      disabled={!newTicket.type}
                    >
                      Crear
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <Table>
                {isLoadingTicketTypes ? (
                  <TableSkeleton 
                    columns={6} 
                    rows={5}
                    headers={["Evento", "Nombre", "Color", "TP ID", "Máx. Canjes", "Acciones"]}
                  />
                ) : (
                  <>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evento</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>TP ID</TableHead>
                        <TableHead>Máx. Canjes</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ticketTypes.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>{ticket.eventName}</TableCell>
                      <TableCell>{ticket.type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: ticket.color }}
                          />
                          {ticket.color}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ticket.tp_id && (
                          <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                            {ticket.tp_id}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {ticket.maximo_canjes === 0 ? 'Ilimitado' : ticket.maximo_canjes}
                          </span>
                          {ticket.maximo_canjes === 0 && (
                            <span className="text-xs text-muted-foreground">∞</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditTicketType(ticket)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                      ))}
                    </TableBody>
                  </>
                )}
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Diálogo de Edición de Evento */}
        <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Evento</DialogTitle>
              <DialogDescription>
                Modifica los detalles del evento.
              </DialogDescription>
            </DialogHeader>
            {editingEvent && (
              <div className="space-y-6 py-4">
                {/* Información Básica */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                    Información Básica
                  </h3>
                  
                  {/* Nombre del Evento */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-sm font-medium">
                      Nombre del Evento
                    </Label>
                    <Input
                      id="edit-name"
                      value={editingEvent.name}
                      onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                      className="w-full"
                      placeholder="Nombre del evento"
                    />
                  </div>

                  {/* Fila con Fecha, TP ID y Canjes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-date" className="text-sm font-medium">
                        Fecha
                      </Label>
                      <Input
                        id="edit-date"
                        type="date"
                        value={editingEvent.date}
                        onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-tp-id" className="text-sm font-medium">
                        TP ID
                      </Label>
                      <Input
                        id="edit-tp-id"
                        value={editingEvent.tp_id || ""}
                        onChange={(e) => setEditingEvent({ ...editingEvent, tp_id: e.target.value })}
                        className="w-full"
                        placeholder="Ej: ROCK2025"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Canjes Habilitados
                      </Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          id="edit-exchanges"
                          checked={editingEvent.enabled_for_exchanges}
                          onCheckedChange={(checked) => setEditingEvent({ ...editingEvent, enabled_for_exchanges: checked })}
                        />
                        <Label htmlFor="edit-exchanges" className="text-sm text-muted-foreground">
                          {editingEvent.enabled_for_exchanges ? 'Habilitados' : 'Deshabilitados'}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección de Tipos de Tickets */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                    Gestión de Tipos de Tickets
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tickets Enlazados */}
                    <Card className="border-none shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-success flex items-center gap-2">
                          <div className="w-2 h-2 bg-success rounded-full"></div>
                          Tickets Enlazados ({getEventTicketTypes(editingEvent.id).length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {getEventTicketTypes(editingEvent.id).map((ticket) => (
                          <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg bg-success/5 hover:bg-success/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: ticket.color }}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{ticket.type}</span>
                                {ticket.tp_id && (
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {ticket.tp_id}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnlinkTicketFromEvent(ticket.id)}
                              className="text-xs hover:bg-destructive/10 hover:text-destructive"
                            >
                              Desenlazar
                            </Button>
                          </div>
                        ))}
                        {getEventTicketTypes(editingEvent.id).length === 0 && (
                          <div className="text-center py-6 text-muted-foreground">
                            <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No hay tickets enlazados</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Tickets Disponibles */}
                    <Card className="border-none shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          Tickets Disponibles ({getAvailableTicketTypes().length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {getAvailableTicketTypes().map((ticket) => (
                          <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-primary/5 transition-colors">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: ticket.color }}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{ticket.type}</span>
                                {ticket.tp_id && (
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {ticket.tp_id}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLinkTicketToEvent(ticket.id, editingEvent.id)}
                              className="text-xs hover:bg-primary/10 hover:text-primary"
                            >
                              Enlazar
                            </Button>
                          </div>
                        ))}
                        {getAvailableTicketTypes().length === 0 && (
                          <div className="text-center py-6 text-muted-foreground">
                            <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No hay tickets disponibles</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditEventOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateEvent}>Actualizar Evento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Edición de Tipo de Ticket */}
        <Dialog open={isEditTicketOpen} onOpenChange={setIsEditTicketOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Tipo de Ticket</DialogTitle>
              <DialogDescription>
                Modifica los detalles del tipo de ticket.
              </DialogDescription>
            </DialogHeader>
            {editingTicket && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-ticket-type" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="edit-ticket-type"
                    value={editingTicket.type}
                    onChange={(e) => setEditingTicket({ ...editingTicket, type: e.target.value })}
                    className="col-span-3"
                    placeholder="Ej: General, VIP, Premium"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Evento Enlazado
                  </Label>
                  <div className="col-span-3">
                    {editingTicket.eventId && editingTicket.eventName ? (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <span className="text-sm font-medium">{editingTicket.eventName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTicket({ ...editingTicket, eventId: "", eventName: "" })}
                        >
                          Desenlazar
                        </Button>
                      </div>
                    ) : (
                      <Select onValueChange={(value) => {
                        const event = events.find(e => e.id === value);
                        setEditingTicket({ 
                          ...editingTicket, 
                          eventId: value, 
                          eventName: event?.name || "" 
                        });
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar evento (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {events.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Color
                  </Label>
                  <div className="col-span-3">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { color: "#6B7280", name: "Gris" },
                        { color: "#3B82F6", name: "Azul" },
                        { color: "#10B981", name: "Verde" },
                        { color: "#F59E0B", name: "Amarillo" },
                        { color: "#EF4444", name: "Rojo" },
                        { color: "#8B5CF6", name: "Púrpura" },
                        { color: "#06B6D4", name: "Cian" },
                        { color: "#84CC16", name: "Lima" },
                        { color: "#F97316", name: "Naranja" },
                        { color: "#EC4899", name: "Rosa" }
                      ].map(({ color, name }) => (
                        <button
                          key={color}
                          type="button"
                          title={`Seleccionar color ${name}`}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                            editingTicket.color === color 
                              ? 'border-foreground shadow-lg' 
                              : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditingTicket({ ...editingTicket, color })}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Seleccionado: <span className="font-mono">{editingTicket.color}</span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-ticket-tp-id" className="text-right">
                    TP ID
                  </Label>
                  <Input
                    id="edit-ticket-tp-id"
                    value={editingTicket.tp_id || ""}
                    onChange={(e) => setEditingTicket({ ...editingTicket, tp_id: e.target.value })}
                    className="col-span-3"
                    placeholder="Ej: ROCK-GEN"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-ticket-maximo" className="text-right">
                    Máximo
                  </Label>
                  <div className="col-span-3 space-y-2">
                    <Input
                      id="edit-ticket-maximo"
                      type="number"
                      min="0"
                      value={editingTicket.maximo_canjes || 0}
                      onChange={(e) => setEditingTicket({ ...editingTicket, maximo_canjes: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Máximo número de canjes permitidos para este tipo de ticket. 
                      <br />
                      <strong>0 = Sin límite</strong> (canjes ilimitados)
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditTicketOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateTicketType}>Actualizar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Resumen del Evento */}
        <Dialog open={isEventSummaryOpen} onOpenChange={setIsEventSummaryOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Resumen del Evento
              </DialogTitle>
              <DialogDescription>
                Información detallada del evento y sus tipos de tickets
              </DialogDescription>
            </DialogHeader>
            {summaryEvent && (
              <div className="space-y-6 py-4">
                {/* Información del Evento */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                    Información del Evento
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Nombre</Label>
                        <p className="text-base font-medium">{summaryEvent.name}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Canjes</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={summaryEvent.enabled_for_exchanges ? "default" : "secondary"}>
                            {summaryEvent.enabled_for_exchanges ? "Habilitados" : "Deshabilitados"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {summaryEvent.tp_id && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">TP ID del Evento</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Ticket className="w-4 h-4 text-muted-foreground" />
                            <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                              {summaryEvent.tp_id}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tipos de Tickets del Evento */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                    Tipos de Tickets
                  </h3>
                  
                  {getEventTicketTypes(summaryEvent.id).length > 0 ? (
                    <div className="space-y-3">
                      {getEventTicketTypes(summaryEvent.id).map((ticket) => (
                        <Card key={ticket.id} className="border-none shadow-sm bg-muted/30">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded-full border"
                                  style={{ backgroundColor: ticket.color }}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">{ticket.type}</span>
                                  {ticket.tp_id && (
                                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded mt-1 w-fit">
                                      TP ID: {ticket.tp_id}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Máx. Canjes:</span>
                                  <Badge variant="outline" className="text-xs">
                                    {ticket.maximo_canjes === 0 ? 'Ilimitado ∞' : ticket.maximo_canjes}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay tipos de tickets enlazados a este evento</p>
                      <p className="text-xs">Los tipos de tickets se pueden enlazar desde la pestaña "Tipos de Tickets"</p>
                    </div>
                  )}
                </div>

                {/* Resumen Estadístico */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                    Resumen
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-primary/5 p-3 rounded-lg border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Tipos de Tickets:</span>
                        <span className="font-bold text-primary">
                          {getEventTicketTypes(summaryEvent.id).length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Con Límite:</span>
                        <span className="font-bold text-green-600">
                          {getEventTicketTypes(summaryEvent.id).filter(t => t.maximo_canjes && t.maximo_canjes > 0).length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Ilimitados:</span>
                        <span className="font-bold text-blue-600">
                          {getEventTicketTypes(summaryEvent.id).filter(t => !t.maximo_canjes || t.maximo_canjes === 0).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEventSummaryOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alert Dialog para confirmar eliminación de evento */}
        <AlertDialog open={isDeleteEventDialogOpen} onOpenChange={setIsDeleteEventDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el evento y todos sus datos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setEventToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteEvent}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Events;
