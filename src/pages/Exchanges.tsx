import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Repeat, CheckCircle, XCircle, Clock, Plus, Search, User, Calendar, Ticket, ChevronDown, Check, X } from "lucide-react";
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
  targetEvent: string;
  targetTicketType: string;
  status: "pending" | "approved" | "rejected" | "completed";
  requestDate: string;
  processedDate?: string;
  reason?: string;
};

type Attendee = {
  id: string;
  nombre: string;
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
};

const Exchanges = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isNewExchangeOpen, setIsNewExchangeOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);

  const [newExchange, setNewExchange] = useState({
    attendeeId: "",
    attendeeName: "",
    attendeeEmail: "",
    originalEventId: "",
    targetEventId: "",
    selectedTicketTypes: [] as SelectedTicketType[],
    reason: ""
  });

  // Estados para los searchboxes
  const [attendeeSearchOpen, setAttendeeSearchOpen] = useState(false);
  const [originalEventSearchOpen, setOriginalEventSearchOpen] = useState(false);
  const [attendeeSearchTerm, setAttendeeSearchTerm] = useState("");
  const [originalEventSearchTerm, setOriginalEventSearchTerm] = useState("");
  const [targetEventSearchTerm, setTargetEventSearchTerm] = useState("");
  const [targetEventSearchOpen, setTargetEventSearchOpen] = useState(false);

  // Fetch attendees from Supabase
  const { data: attendees = [] } = useQuery({
    queryKey: ["attendees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asistentes")
        .select("id, nombre, email")
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

  const { data: ticketTypes = [] } = useQuery({
    queryKey: ["ticket-types", newExchange.originalEventId],
    queryFn: async () => {
      if (!newExchange.originalEventId) return [];
      const { data, error } = await supabase
        .from("tipos_tickets")
        .select("id, tipo, tp_id, color")
        .eq("evento_id", newExchange.originalEventId)
        .order("tipo");
      if (error) throw error;
      return data as TicketType[];
    },
    enabled: !!newExchange.originalEventId,
  });

  const { data: exchanges = [], isLoading } = useQuery({
    queryKey: ["exchanges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canjes')
        .select(`
          id,
          nombre_asistente,
          apellido_asistente,
          estado,
          motivo,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match Exchange type
      return data.map(exchange => ({
        id: exchange.id,
        attendeeName: `${exchange.nombre_asistente || ''} ${exchange.apellido_asistente || ''}`.trim() || 'Sin nombre',
        attendeeEmail: 'Sin email', // Will be populated when relations are fixed
        originalEvent: 'Sin evento', // Will be populated when relations are fixed
        originalTicketType: 'Sin tipo', // Will be populated when relations are fixed
        targetEvent: 'Sin evento', // Will be populated when relations are fixed
        targetTicketType: 'Sin tipo', // Will be populated when relations are fixed
        status: exchange.estado as "pending" | "approved" | "rejected" | "completed",
        requestDate: exchange.created_at,
        processedDate: exchange.updated_at !== exchange.created_at ? exchange.updated_at : undefined,
        reason: exchange.motivo
      }));
    },
  });

  const filteredExchanges = exchanges.filter(exchange => {
    const matchesSearch = exchange.attendeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exchange.attendeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exchange.originalEvent.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exchange.targetEvent.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || exchange.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case "approved":
        return <Badge className="bg-green-500 text-white hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      case "completed":
        return <Badge className="bg-primary text-primary-foreground"><CheckCircle className="w-3 h-3 mr-1" />Completado</Badge>;
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
      attendeeEmail: attendee.email
    });
    setAttendeeSearchOpen(false);
    setAttendeeSearchTerm(`${attendee.nombre} (${attendee.email})`);
  };

  const handleSelectOriginalEvent = (event: Event) => {
    setNewExchange({
      ...newExchange,
      originalEventId: event.id,
      selectedTicketTypes: [] // Reset ticket types when event changes
    });
    setOriginalEventSearchOpen(false);
    setOriginalEventSearchTerm(event.nombre);
  };

  const handleSelectTargetEvent = (event: Event) => {
    setNewExchange({
      ...newExchange,
      targetEventId: event.id
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
          color: ticketType.color
        }]
      });
    }
  };

  const handleCreateExchange = () => {
    toast({
      title: "Canje creado",
      description: "La solicitud de canje ha sido creada exitosamente.",
    });
    setIsNewExchangeOpen(false);
    setNewExchange({
      attendeeId: "",
      attendeeName: "",
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
  };

  // Filtrar datos para los searchboxes
  const filteredAttendees = attendees.filter(attendee => 
    attendee.nombre?.toLowerCase().includes(attendeeSearchTerm.toLowerCase()) ||
    attendee.email?.toLowerCase().includes(attendeeSearchTerm.toLowerCase())
  );

  const filteredOriginalEvents = events.filter(event => 
    event.nombre?.toLowerCase().includes(originalEventSearchTerm.toLowerCase())
  );

  const filteredTargetEvents = events.filter(event => 
    event.nombre?.toLowerCase().includes(targetEventSearchTerm.toLowerCase()) &&
    event.id !== newExchange.originalEventId // No permitir el mismo evento
  );

  const stats = [
    { title: "Total Canjes", value: exchanges.length.toString(), icon: Repeat },
    { title: "Pendientes", value: exchanges.filter(e => e.status === "pending").length.toString(), icon: Clock },
    { title: "Aprobados", value: exchanges.filter(e => e.status === "approved").length.toString(), icon: CheckCircle },
    { title: "Completados", value: exchanges.filter(e => e.status === "completed").length.toString(), icon: CheckCircle },
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
                    Evento Original
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

                {/* Selector de Tipos de Tickets */}
                {newExchange.originalEventId && (
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
                          const isSelected = newExchange.selectedTicketTypes.some(t => t.id === ticketType.id);
                          return (
                            <div
                              key={ticketType.id}
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
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Searchbox para Evento Destino */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Evento Destino
                  </Label>
                  <Popover open={targetEventSearchOpen} onOpenChange={setTargetEventSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={targetEventSearchOpen}
                        className="w-full justify-between"
                        disabled={!newExchange.originalEventId}
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
                  {!newExchange.originalEventId && (
                    <p className="text-sm text-muted-foreground">
                      Primero selecciona el evento original
                    </p>
                  )}
                </div>

                {/* Campo de Motivo */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo del Canje</Label>
                  <Input
                    id="reason"
                    value={newExchange.reason}
                    onChange={(e) => setNewExchange({ ...newExchange, reason: e.target.value })}
                    placeholder="Describe la razón del canje..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCreateExchange}
                  disabled={!newExchange.attendeeId || !newExchange.originalEventId || !newExchange.targetEventId || newExchange.selectedTicketTypes.length === 0}
                >
                  Crear Solicitud
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
                  <option value="completed">Completados</option>
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
                    <TableHead>Asistente</TableHead>
                    <TableHead>Evento Original</TableHead>
                    <TableHead>Evento Destino</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Solicitud</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                {isLoading ? (
                  <TableSkeleton 
                    columns={7} 
                    rows={5}
                    headers={["Asistente", "Evento Original", "Tipo Original", "Evento Destino", "Tipo Destino", "Estado", "Acciones"]}
                  />
                ) : (
                  <TableBody>
                    {filteredExchanges.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
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
                      <TableRow key={exchange.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{exchange.attendeeName}</div>
                            <div className="text-sm text-muted-foreground">{exchange.attendeeEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{exchange.originalEvent}</div>
                            <div className="text-sm text-muted-foreground">{exchange.originalTicketType}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{exchange.targetEvent}</div>
                            <div className="text-sm text-muted-foreground">{exchange.targetTicketType}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(exchange.status)}</TableCell>
                        <TableCell>
                          {new Date(exchange.requestDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{exchange.reason}</TableCell>
                        <TableCell>
                          {exchange.status === "pending" && (
                            <div className="flex gap-2">
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
                            </div>
                          )}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Evento Original</Label>
                    <p className="text-sm">{selectedExchange.originalEvent} - {selectedExchange.originalTicketType}</p>
                  </div>
                  <div>
                    <Label>Evento Destino</Label>
                    <p className="text-sm">{selectedExchange.targetEvent} - {selectedExchange.targetTicketType}</p>
                  </div>
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
      </div>
    </Layout>
  );
};

export default Exchanges;
