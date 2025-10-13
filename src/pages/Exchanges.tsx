import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Repeat, CheckCircle, XCircle, Clock, Plus, Search, User, Calendar, Ticket, ChevronDown, Check, X, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { 
  TableSkeleton, 
  FormSkeleton, 
  SearchSkeleton 
} from "@/components/ui/skeleton-components";

type Exchange = {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  originalEvent: string;
  originalTicketType: string;
  status: "pending" | "approved" | "rejected" | "canjeado";
  requestDate: string;
  processedDate?: string;
  reason?: string;
  emailErrorEnviado?: boolean;
  errorTp?: boolean;
  canjeadoTp?: boolean;
  ticketIds?: string[];
  invoiceId?: string;
  responseTp?: string;
};

type Attendee = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
};

type Event = {
  id: string;
  nombre: string;
  tp_id?: string;
  fecha: string;
};

type TicketType = {
  id: string;
  tipo: string;
  tp_id?: string;
  evento_id: string;
  color?: string;
};

type SelectedTicketType = {
  id: string;
  tipo: string;
  tp_id?: string;
  color?: string;
  cantidad: number;
};

const Exchanges = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isNewExchangeOpen, setIsNewExchangeOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [exchangeToDelete, setExchangeToDelete] = useState<Exchange | null>(null);
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);

  const [newExchange, setNewExchange] = useState({
    attendeeId: "",
    attendeeName: "",
    attendeeApellido: "",
    attendeeEmail: "",
    originalEventId: "",
    targetEventId: "",
    selectedTicketTypes: [] as SelectedTicketType[],
    reason: ""
  });

  // Estados para los searchboxes
  const [attendeeSearchOpen, setAttendeeSearchOpen] = useState(false);
  const [originalEventSearchOpen, setOriginalEventSearchOpen] = useState(false);
  const [targetEventSearchOpen, setTargetEventSearchOpen] = useState(false);
  const [attendeeSearchTerm, setAttendeeSearchTerm] = useState("");
  const [originalEventSearchTerm, setOriginalEventSearchTerm] = useState("");
  const [targetEventSearchTerm, setTargetEventSearchTerm] = useState("");

  // Fetch attendees from Supabase
  const { data: attendees = [] } = useQuery({
    queryKey: ["attendees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asistentes")
        .select("id, nombre, apellido, email")
        .order("nombre");
      if (error) throw error;
      return data as Attendee[];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos")
        .select("id, nombre, tp_id, fecha")
        .order("nombre");
      if (error) throw error;
      return data as Event[];
    },
  });

  // Fetch asistencias of selected attendee
  const { data: attendeeAsistencias = [] } = useQuery({
    queryKey: ["attendee-asistencias", newExchange.attendeeId],
    queryFn: async () => {
      if (!newExchange.attendeeId) return [];
      const { data, error } = await supabase
        .from("asistencias")
        .select("evento_id")
        .eq("asistente_id", newExchange.attendeeId);
      if (error) throw error;
      return data.map(a => a.evento_id);
    },
    enabled: !!newExchange.attendeeId,
  });

  const { data: ticketTypes = [] } = useQuery({
    queryKey: ["ticket-types", newExchange.targetEventId],
    queryFn: async () => {
      if (!newExchange.targetEventId) return [];
      const { data, error } = await supabase
        .from("tipos_tickets")
        .select("id, tipo, tp_id, color")
        .eq("evento_id", newExchange.targetEventId)
        .order("tipo");
      if (error) throw error;
      return data as TicketType[];
    },
    enabled: !!newExchange.targetEventId,
  });

  const { data: exchanges = [], isLoading, refetch } = useQuery({
    queryKey: ["exchanges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canjes')
        .select(`
          id,
          nombre_asistente,
          apellido_asistente,
          correo,
          cantidad,
          estado,
          motivo,
          created_at,
          updated_at,
          email_error_enviado,
          ERROR_TP,
          canjeado_tp,
          ticket_ids,
          invoice_id,
          response_tp,
          evento_original:eventos!evento_original_id(nombre),
          tipo_ticket_original:tipos_tickets!tipo_ticket_original_id(tipo)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match Exchange type
      return data.map((exchange: any) => ({
        id: exchange.id,
        attendeeName: `${exchange.nombre_asistente || ''} ${exchange.apellido_asistente || ''}`.trim() || 'Sin nombre',
        attendeeEmail: exchange.correo || 'Sin email',
        originalEvent: exchange.evento_original?.nombre || 'Sin evento',
        originalTicketType: `${exchange.tipo_ticket_original?.tipo || 'Sin tipo'} (${exchange.cantidad || 1})`,
        status: (exchange.estado === "completed" ? "canjeado" : exchange.estado) as "pending" | "approved" | "rejected" | "canjeado",
        requestDate: exchange.created_at,
        processedDate: exchange.updated_at !== exchange.created_at ? exchange.updated_at : undefined,
        reason: exchange.motivo,
        emailErrorEnviado: exchange.email_error_enviado || false,
        errorTp: exchange.ERROR_TP || false,
        canjeadoTp: exchange.canjeado_tp || false,
        ticketIds: exchange.ticket_ids || [],
        invoiceId: exchange.invoice_id,
        responseTp: exchange.response_tp
      }));
    },
  });

  // Realtime subscriptions para actualizar datos automáticamente
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'canjes'
        },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asistentes'
        },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'eventos'
        },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tipos_tickets'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const filteredExchanges = exchanges.filter(exchange => {
    const matchesSearch = exchange.attendeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exchange.attendeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exchange.originalEvent.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || exchange.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "disponible":
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600"><CheckCircle className="w-3 h-3 mr-1" />Disponible</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case "approved":
        return <Badge className="bg-green-500 text-white hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      case "canjeados":
        return <Badge className="bg-green-600 text-white hover:bg-green-700"><CheckCircle className="w-3 h-3 mr-1" />Canjeados</Badge>;
      case "esperando_tp":
        return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" />Esperando TP</Badge>;
      case "canjeado":
        return <Badge className="bg-green-600 text-white hover:bg-green-700"><CheckCircle className="w-3 h-3 mr-1" />Canjeado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleProcessExchange = (exchange: Exchange, action: "approve" | "reject") => {
    toast({
      title: `Canje ${action === "approve" ? "aprobado" : "rechazado"}`,
      description: `El canje de ${exchange.attendeeName} ha sido ${action === "approve" ? "aprobado" : "rechazado"}.`,
      variant: action === "approve" ? "default" : "destructive",
    });
    setIsProcessDialogOpen(false);
    setSelectedExchange(null);
  };

  // Funciones para manejar la selección de datos
  const handleSelectAttendee = (attendee: Attendee) => {
    setNewExchange({
      ...newExchange,
      attendeeId: attendee.id,
      attendeeName: attendee.nombre,
      attendeeApellido: attendee.apellido || '',
      attendeeEmail: attendee.email,
      originalEventId: "", // Reset evento original cuando cambia el asistente
      targetEventId: "", // Reset evento destino cuando cambia el asistente
      selectedTicketTypes: [] // Reset tipos de tickets cuando cambia el asistente
    });
    setAttendeeSearchOpen(false);
    setAttendeeSearchTerm(`${attendee.nombre} ${attendee.apellido || ''} (${attendee.email})`);
    setOriginalEventSearchTerm(""); // Reset búsqueda de evento original
    setTargetEventSearchTerm(""); // Reset búsqueda de evento destino
  };

  const handleSelectOriginalEvent = (event: Event) => {
    setNewExchange({
      ...newExchange,
      originalEventId: event.id,
      targetEventId: "", // Reset target event when original changes
      selectedTicketTypes: [] // Reset ticket types when event changes
    });
    setOriginalEventSearchOpen(false);
    setOriginalEventSearchTerm(event.nombre);
    setTargetEventSearchTerm(""); // Reset target search
  };

  const handleSelectTargetEvent = (event: Event) => {
    setNewExchange({
      ...newExchange,
      targetEventId: event.id,
      selectedTicketTypes: [] // Reset ticket types when target event changes
    });
    setTargetEventSearchOpen(false);
    setTargetEventSearchTerm(event.nombre);
  };

  const handleToggleTicketType = (ticketType: TicketType) => {
    const isSelected = newExchange.selectedTicketTypes.some(t => t.id === ticketType.id);
    
    if (isSelected) {
      setNewExchange({
        ...newExchange,
        selectedTicketTypes: newExchange.selectedTicketTypes.filter(t => t.id !== ticketType.id)
      });
    } else {
      setNewExchange({
        ...newExchange,
        selectedTicketTypes: [...newExchange.selectedTicketTypes, {
          id: ticketType.id,
          tipo: ticketType.tipo,
          tp_id: ticketType.tp_id,
          color: ticketType.color,
          cantidad: 1
        }]
      });
    }
  };

  const handleUpdateTicketQuantity = (ticketId: string, cantidad: number) => {
    setNewExchange({
      ...newExchange,
      selectedTicketTypes: newExchange.selectedTicketTypes.map(t => 
        t.id === ticketId ? { ...t, cantidad: Math.max(1, cantidad) } : t
      )
    });
  };

  const handleCreateExchange = async () => {
    // Validación antes de crear
    if (!newExchange.attendeeId || !newExchange.attendeeEmail || !newExchange.attendeeName) {
      toast({
        title: "Error de validación",
        description: "Debe seleccionar un asistente válido.",
        variant: "destructive"
      });
      return;
    }

    if (!newExchange.originalEventId) {
      toast({
        title: "Error de validación",
        description: "Debe seleccionar un evento original.",
        variant: "destructive"
      });
      return;
    }

    if (!newExchange.targetEventId) {
      toast({
        title: "Error de validación",
        description: "Debe seleccionar un evento al cual canjear.",
        variant: "destructive"
      });
      return;
    }

    if (newExchange.selectedTicketTypes.length === 0) {
      toast({
        title: "Error de validación",
        description: "Debe seleccionar al menos un tipo de ticket.",
        variant: "destructive"
      });
      return;
    }

    try {
      // 1. Verificar que el asistente existe
      const { data: attendeeExists, error: attendeeError } = await supabase
        .from('asistentes')
        .select('id, nombre, apellido, email')
        .eq('email', newExchange.attendeeEmail)
        .maybeSingle();

      if (attendeeError) throw attendeeError;

      if (!attendeeExists) {
        toast({
          title: "Error",
          description: "No se encontró un asistente con ese correo electrónico.",
          variant: "destructive"
        });
        return;
      }

      // 2. Verificar si tiene canjes disponibles
      const { data: availableExchanges, error: exchangeError } = await supabase
        .from('canjes')
        .select('id, estado')
        .eq('correo', newExchange.attendeeEmail)
        .eq('estado', 'pendiente');

      if (exchangeError) throw exchangeError;

      if (availableExchanges && availableExchanges.length > 0) {
        toast({
          title: "Aviso",
          description: `Este asistente tiene ${availableExchanges.length} canje(s) pendiente(s). Se procederá a crear uno nuevo.`,
          variant: "default"
        });
      }

      // Obtener información del evento
      const { data: eventInfo, error: eventInfoError } = await supabase
        .from('eventos')
        .select('tp_id')
        .eq('id', newExchange.originalEventId)
        .single();

      if (eventInfoError) throw eventInfoError;

      // Crear un registro de canje por cada tipo de ticket seleccionado
      const promises = newExchange.selectedTicketTypes.map(async (ticketType) => {
        // Obtener información del tipo de ticket
        const { data: ticketTypeInfo } = await supabase
          .from('tipos_tickets')
          .select('tp_id')
          .eq('id', ticketType.id)
          .single();

        const { error } = await supabase
          .from('canjes')
          .insert({
            nombre_asistente: newExchange.attendeeName,
            apellido_asistente: newExchange.attendeeApellido,
            correo: newExchange.attendeeEmail,
            asistente_id: newExchange.attendeeId,
            evento_original_id: newExchange.originalEventId,
            tipo_ticket_original_id: ticketType.id,
            cantidad: ticketType.cantidad,
            motivo: newExchange.reason || null,
            estado: 'pendiente',
            diferencia_precio: 0,
            fecha_solicitud: new Date().toISOString(),
            evento_tp_id: eventInfo?.tp_id || null,
            ticket_tp_id: ticketTypeInfo?.tp_id || null,
            notas_admin: null,
            fecha_procesado: null,
            procesado_por: null,
            metodo_pago_diferencia: null,
            ticket_ids: [],
            invoice_id: null,
            canjeado_tp: false
          });
        
        if (error) throw error;
      });

      await Promise.all(promises);

      toast({
        title: "Canje creado",
        description: `Se crearon ${newExchange.selectedTicketTypes.length} solicitud(es) de canje exitosamente.`,
      });
      
      // Refrescar la lista de canjes
      refetch();
      
      setIsNewExchangeOpen(false);
      setNewExchange({
        attendeeId: "",
        attendeeName: "",
        attendeeApellido: "",
        attendeeEmail: "",
        originalEventId: "",
        targetEventId: "",
        selectedTicketTypes: [],
        reason: ""
      });
      // Reset search terms
      setAttendeeSearchTerm("");
      setOriginalEventSearchTerm("");
      setTargetEventSearchTerm("");
    } catch (error: any) {
      console.error('Error creating exchange:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la solicitud de canje.",
        variant: "destructive"
      });
    }
  };

  // Filtrar datos para los searchboxes
  const filteredAttendees = attendees.filter(attendee => 
    attendee.nombre?.toLowerCase().includes(attendeeSearchTerm.toLowerCase()) ||
    attendee.email?.toLowerCase().includes(attendeeSearchTerm.toLowerCase())
  );

  // Filtrar eventos originales: solo mostrar eventos donde el asistente tiene asistencias
  const filteredOriginalEvents = events.filter(event => {
    const matchesSearch = event.nombre?.toLowerCase().includes(originalEventSearchTerm.toLowerCase());
    const attendeeHasTicket = newExchange.attendeeId ? attendeeAsistencias.includes(event.id) : true;
    return matchesSearch && attendeeHasTicket;
  });

  // Filtrar eventos destino: excluir el evento original y eventos donde el asistente ya tiene tickets
  const filteredTargetEvents = events.filter(event => {
    const matchesSearch = event.nombre?.toLowerCase().includes(targetEventSearchTerm.toLowerCase());
    const notOriginalEvent = event.id !== newExchange.originalEventId;
    const attendeeDoesntHaveTicket = newExchange.attendeeId ? !attendeeAsistencias.includes(event.id) : true;
    return matchesSearch && notOriginalEvent && attendeeDoesntHaveTicket;
  });

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'canjes'
        },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asistentes'
        },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'eventos'
        },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tipos_tickets'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const handleDeleteExchange = async () => {
    if (!exchangeToDelete) return;

    try {
      const { error } = await supabase
        .from('canjes')
        .delete()
        .eq('id', exchangeToDelete.id);

      if (error) throw error;

      toast({
        title: "Canje eliminado",
        description: "El canje ha sido eliminado exitosamente.",
      });

      setIsDeleteDialogOpen(false);
      setExchangeToDelete(null);
    } catch (error) {
      console.error("Error al eliminar canje:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el canje. Intente nuevamente.",
        variant: "destructive"
      });
    }
  };

  const handleSelectAll = () => {
    const selectableExchanges = filteredExchanges.filter(e => e.status !== "canjeado");
    if (selectedExchanges.length === selectableExchanges.length) {
      setSelectedExchanges([]);
    } else {
      setSelectedExchanges(selectableExchanges.map(e => e.id));
    }
  };

  const handleSelectExchange = (exchangeId: string) => {
    if (selectedExchanges.includes(exchangeId)) {
      setSelectedExchanges(selectedExchanges.filter(id => id !== exchangeId));
    } else {
      setSelectedExchanges([...selectedExchanges, exchangeId]);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedExchanges.length === 0) {
      toast({
        title: "Sin selección",
        description: "Seleccione al menos un canje para aprobar.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('canjes')
        .update({ estado: 'aprobado' })
        .in('id', selectedExchanges);

      if (error) throw error;

      toast({
        title: "Canjes aprobados",
        description: `Se aprobaron ${selectedExchanges.length} canje(s) exitosamente.`,
      });

      setSelectedExchanges([]);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron aprobar los canjes.",
        variant: "destructive",
      });
    }
  };

  const stats = [
    { title: "Total Canjes", value: exchanges.length.toString(), icon: Repeat },
    { title: "Pendientes", value: exchanges.filter(e => e.status === "pending").length.toString(), icon: Clock },
    { title: "Aprobados", value: exchanges.filter(e => e.status === "approved").length.toString(), icon: CheckCircle },
    { title: "Canjeados", value: exchanges.filter(e => e.status === "canjeado").length.toString(), icon: CheckCircle },
  ];

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Gestión de Canjes
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra las solicitudes de intercambio de tickets
            </p>
          </div>
          <Dialog open={isNewExchangeOpen} onOpenChange={setIsNewExchangeOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Canje
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Repeat className="w-5 h-5" />
                  Crear Solicitud de Canje
                </DialogTitle>
                <DialogDescription>
                  Completa los detalles de la nueva solicitud de canje.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* Searchbox para Asistente */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Asistente
                  </Label>
                  <Popover open={attendeeSearchOpen} onOpenChange={setAttendeeSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={attendeeSearchOpen}
                        className="w-full justify-between"
                      >
                        {newExchange.attendeeName ? (
                          <span className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {newExchange.attendeeName} ({newExchange.attendeeEmail})
                          </span>
                        ) : (
                          "Buscar asistente..."
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Buscar por nombre o email..." 
                          value={attendeeSearchTerm}
                          onValueChange={setAttendeeSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>No se encontraron asistentes.</CommandEmpty>
                          <CommandGroup>
                            {filteredAttendees.map((attendee) => (
                              <CommandItem
                                key={attendee.id}
                                value={`${attendee.nombre} ${attendee.email}`}
                                onSelect={() => handleSelectAttendee(attendee)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newExchange.attendeeId === attendee.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{attendee.nombre}</span>
                                  <span className="text-sm text-muted-foreground">{attendee.email}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Searchbox para Evento Original */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Evento Original (del cual se hace el canje)
                  </Label>
                  <Popover open={originalEventSearchOpen} onOpenChange={setOriginalEventSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={originalEventSearchOpen}
                        className="w-full justify-between"
                      >
                        {originalEventSearchTerm || "Seleccionar evento original..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Buscar evento..." 
                          value={originalEventSearchTerm}
                          onValueChange={setOriginalEventSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>No se encontraron eventos.</CommandEmpty>
                          <CommandGroup>
                            {filteredOriginalEvents.map((event) => (
                              <CommandItem
                                key={event.id}
                                value={event.nombre}
                                onSelect={() => handleSelectOriginalEvent(event)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newExchange.originalEventId === event.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{event.nombre}</span>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(event.fecha).toLocaleDateString()}
                                    {event.tp_id && (
                                      <span className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                                        {event.tp_id}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Searchbox para Evento Destino */}
                {newExchange.originalEventId && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Repeat className="w-4 h-4" />
                      Evento al cual canjear
                    </Label>
                    <Popover open={targetEventSearchOpen} onOpenChange={setTargetEventSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={targetEventSearchOpen}
                          className="w-full justify-between"
                        >
                          {targetEventSearchTerm || "Seleccionar evento destino..."}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Buscar evento..." 
                            value={targetEventSearchTerm}
                            onValueChange={setTargetEventSearchTerm}
                          />
                          <CommandList>
                            <CommandEmpty>No se encontraron eventos.</CommandEmpty>
                            <CommandGroup>
                              {filteredTargetEvents.map((event) => (
                                <CommandItem
                                  key={event.id}
                                  value={event.nombre}
                                  onSelect={() => handleSelectTargetEvent(event)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newExchange.targetEventId === event.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{event.nombre}</span>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(event.fecha).toLocaleDateString()}
                                      {event.tp_id && (
                                        <span className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                                          {event.tp_id}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Selector de Tipos de Tickets */}
                {newExchange.targetEventId && (
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      Tipos de Tickets a Canjear
                      {newExchange.selectedTicketTypes.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {newExchange.selectedTicketTypes.length} seleccionados
                        </Badge>
                      )}
                    </Label>
                    <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                      {ticketTypes.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                          <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No hay tipos de tickets disponibles para este evento</p>
                        </div>
                      ) : (
                        ticketTypes.map((ticketType) => {
                          const selectedTicket = newExchange.selectedTicketTypes.find(t => t.id === ticketType.id);
                          const isSelected = !!selectedTicket;
                          return (
                            <div key={ticketType.id} className="space-y-2">
                              <div
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                  isSelected 
                                    ? "bg-primary/10 border-primary" 
                                    : "bg-background hover:bg-muted/50"
                                )}
                                onClick={() => handleToggleTicketType(ticketType)}
                              >
                                <div className="flex items-center gap-3">
                                  <div 
                                    className={cn(
                                      "w-4 h-4 rounded-full border-2",
                                      !ticketType.color && "bg-gray-500"
                                    )}
                                    style={ticketType.color ? { backgroundColor: ticketType.color } : undefined}
                                  />
                                  <div>
                                    <span className="font-medium">{ticketType.tipo}</span>
                                    {ticketType.tp_id && (
                                      <span className="ml-2 px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                                        {ticketType.tp_id}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isSelected ? (
                                  <Check className="w-5 h-5 text-primary" />
                                ) : (
                                  <div className="w-5 h-5 border-2 border-muted-foreground rounded" />
                                )}
                              </div>
                              {isSelected && (
                                <div className="flex items-center gap-2 ml-7 pb-2">
                                  <Label className="text-sm">Cantidad:</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={selectedTicket.cantidad}
                                    onChange={(e) => handleUpdateTicketQuantity(ticketType.id, parseInt(e.target.value) || 1)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-20"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCreateExchange}
                  disabled={!newExchange.attendeeId || !newExchange.originalEventId || !newExchange.targetEventId || newExchange.selectedTicketTypes.length === 0}
                >
                  Crear Solicitud ({newExchange.selectedTicketTypes.length} registro{newExchange.selectedTicketTypes.length !== 1 ? 's' : ''})
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bulk Actions Bar */}
        {selectedExchanges.length > 0 && (
          <Card className="mb-4 border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-base">
                    {selectedExchanges.length} canje(s) seleccionado(s)
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedExchanges([])}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpiar selección
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleBulkApprove}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Aprobar Seleccionados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar canjes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                  title="Filtrar por estado"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="approved">Aprobados</option>
                  <option value="rejected">Rechazados</option>
                  <option value="canjeado">Canjeados</option>
                  <option value="disponible">Disponibles</option>
                  <option value="esperando_tp">Esperando TP</option>
                </select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Exchanges Table */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>
              Solicitudes de Canje ({filteredExchanges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedExchanges.length === filteredExchanges.length && filteredExchanges.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Asistente</TableHead>
                    <TableHead>Evento Original</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Error Email</TableHead>
                    <TableHead className="text-center">Error TP</TableHead>
                    <TableHead className="text-center">Canjeado TP</TableHead>
                    <TableHead>Fecha Solicitud</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                {isLoading ? (
                  <TableSkeleton 
                    columns={9} 
                    rows={5}
                    headers={["", "Asistente", "Evento Original", "Estado", "Error Email", "Error TP", "Canjeado TP", "Fecha Solicitud", "Acciones"]}
                  />
                ) : (
                  <TableBody>
                    {filteredExchanges.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm || filterStatus !== "all" 
                            ? "No se encontraron canjes con los filtros aplicados"
                            : "No hay solicitudes de canje"
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExchanges.map((exchange) => (
                      <TableRow 
                        key={exchange.id}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedExchanges.includes(exchange.id)}
                            onCheckedChange={() => handleSelectExchange(exchange.id)}
                            disabled={exchange.status === "canjeado"}
                          />
                        </TableCell>
                        <TableCell onClick={() => {
                          setSelectedExchange(exchange);
                          setIsDetailsDialogOpen(true);
                        }}>
                          <div>
                            <div className="font-medium">{exchange.attendeeName}</div>
                            <div className="text-sm text-muted-foreground">{exchange.attendeeEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell onClick={() => {
                          setSelectedExchange(exchange);
                          setIsDetailsDialogOpen(true);
                        }}>
                          <div>
                            <div className="font-medium">{exchange.originalEvent}</div>
                            <div className="text-sm text-muted-foreground">{exchange.originalTicketType}</div>
                          </div>
                        </TableCell>
                        <TableCell onClick={() => {
                          setSelectedExchange(exchange);
                          setIsDetailsDialogOpen(true);
                        }}>{getStatusBadge(exchange.status)}</TableCell>
                        <TableCell className="text-center" onClick={() => {
                          setSelectedExchange(exchange);
                          setIsDetailsDialogOpen(true);
                        }}>
                          {exchange.emailErrorEnviado ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center" onClick={() => {
                          setSelectedExchange(exchange);
                          setIsDetailsDialogOpen(true);
                        }}>
                          {exchange.errorTp ? (
                            <Check className="w-5 h-5 text-red-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center" onClick={() => {
                          setSelectedExchange(exchange);
                          setIsDetailsDialogOpen(true);
                        }}>
                          {exchange.canjeadoTp ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground mx-auto" />
                          )}
                        </TableCell>
                        <TableCell onClick={() => {
                          setSelectedExchange(exchange);
                          setIsDetailsDialogOpen(true);
                        }}>
                          {new Date(exchange.requestDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            {exchange.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedExchange(exchange);
                                  setIsProcessDialogOpen(true);
                                }}
                              >
                                Procesar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setExchangeToDelete(exchange);
                                setIsDeleteDialogOpen(true);
                              }}
                              disabled={exchange.status === "canjeado"}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                    )}
                  </TableBody>
                )}
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Canje</DialogTitle>
              <DialogDescription>
                Información completa del registro de canje
              </DialogDescription>
            </DialogHeader>
            {selectedExchange && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Asistente</Label>
                    <p className="font-medium">{selectedExchange.attendeeName}</p>
                    <p className="text-sm text-muted-foreground">{selectedExchange.attendeeEmail}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Evento Original</Label>
                    <p className="font-medium">{selectedExchange.originalEvent}</p>
                    <p className="text-sm text-muted-foreground">{selectedExchange.originalTicketType}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">Ticket IDs</Label>
                      {selectedExchange.ticketIds && selectedExchange.ticketIds.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedExchange.ticketIds.map((ticketId, index) => (
                            <Badge key={index} variant="outline" className="font-mono text-xs">
                              {ticketId}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">Sin tickets asignados</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Invoice ID</Label>
                      {selectedExchange.invoiceId ? (
                        <p className="font-mono text-sm mt-1">{selectedExchange.invoiceId}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">Sin invoice</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Response TP</Label>
                      {selectedExchange.responseTp ? (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                            {selectedExchange.responseTp}
                          </pre>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">Sin respuesta</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Process Exchange Dialog */}
        <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Procesar Solicitud de Canje</DialogTitle>
              <DialogDescription>
                {selectedExchange && `Procesar la solicitud de ${selectedExchange.attendeeName}`}
              </DialogDescription>
            </DialogHeader>
            {selectedExchange && (
              <div className="space-y-4">
                <div>
                  <Label>Evento Original</Label>
                  <p className="text-sm">{selectedExchange.originalEvent} - {selectedExchange.originalTicketType}</p>
                </div>
                <div>
                  <Label>Motivo</Label>
                  <p className="text-sm">{selectedExchange.reason}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => selectedExchange && handleProcessExchange(selectedExchange, "reject")}
              >
                Rechazar
              </Button>
              <Button
                onClick={() => selectedExchange && handleProcessExchange(selectedExchange, "approve")}
              >
                Aprobar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar canje?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el canje de{" "}
                {exchangeToDelete?.attendeeName}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setExchangeToDelete(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteExchange} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Exchanges;
