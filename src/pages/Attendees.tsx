import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Download, Upload, Users, Plus, Eye, Edit, X, Mail, DollarSign, Repeat } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  StatsSkeleton, 
  TableSkeleton
} from "@/components/ui/skeleton-components";

type Asistencia = {
  id: string;
  evento: string;
  eventoTpId: string | null;
  tipoTicket: string;
  tipoTicketTpId: string | null;
  codigoTicket: string;
  estado: string;
  eventoId: string;
  tipoTicketId: string;
};

type Attendee = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  documentoIdentidad?: string;
  fechaNacimiento?: string;
  asistencias: Asistencia[];
};

type EventoConTickets = {
  eventoId: string;
  eventoNombre: string;
  tipoTicketId: string;
  tipoTicketNombre: string;
  precio: number;
};

const Attendees = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEventId, setFilterEventId] = useState<string>("all");
  const [isNewAttendeeOpen, setIsNewAttendeeOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'exchange' | 'refund' | 'email' | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const [newAttendee, setNewAttendee] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    documentoIdentidad: "",
    fechaNacimiento: "",
    eventosSeleccionados: [] as EventoConTickets[]
  });

  const [editAttendee, setEditAttendee] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    documentoIdentidad: "",
    fechaNacimiento: "",
    asistenciasActuales: [] as Asistencia[],
    nuevasAsistencias: [] as EventoConTickets[]
  });

  // Queries
  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('id, nombre')
        .order('nombre');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: allTicketTypes = [] } = useQuery({
    queryKey: ["all-ticket-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_tickets')
        .select(`
          id,
          tipo,
          precio,
          evento_id,
          eventos(nombre)
        `)
        .order('tipo');
      
      if (error) throw error;
      return data.map((tt: any) => ({
        id: tt.id,
        tipo: tt.tipo,
        precio: tt.precio,
        eventoId: tt.evento_id,
        eventoNombre: tt.eventos?.nombre || 'Sin evento'
      }));
    },
  });

  const { data: attendees = [], isLoading, refetch } = useQuery({
    queryKey: ["attendees-with-asistencias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asistentes')
        .select(`
          id,
          nombre,
          apellido,
          email,
          telefono,
          documento_identidad,
          fecha_nacimiento
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Obtener asistencias para cada asistente
      const attendeesWithAsistencias = await Promise.all(
        data.map(async (asistente) => {
          const { data: asistencias, error: asistenciasError } = await supabase
            .from('asistencias')
            .select(`
              id,
              codigo_ticket,
              estado,
              evento_id,
              tipo_ticket_id,
              eventos(nombre, tp_id),
              tipos_tickets(tipo, tp_id)
            `)
            .eq('asistente_id', asistente.id);

          if (asistenciasError) throw asistenciasError;

          return {
            id: asistente.id,
            nombre: asistente.nombre,
            apellido: asistente.apellido,
            email: asistente.email,
            telefono: asistente.telefono,
            documentoIdentidad: asistente.documento_identidad,
            fechaNacimiento: asistente.fecha_nacimiento,
            asistencias: (asistencias || []).map((a: any) => ({
              id: a.id,
              evento: a.eventos?.nombre || 'Sin evento',
              eventoTpId: a.eventos?.tp_id || null,
              tipoTicket: a.tipos_tickets?.tipo || 'Sin tipo',
              tipoTicketTpId: a.tipos_tickets?.tp_id || null,
              codigoTicket: a.codigo_ticket || '',
              estado: a.estado || 'confirmado',
              eventoId: a.evento_id,
              tipoTicketId: a.tipo_ticket_id
            }))
          };
        })
      );

      return attendeesWithAsistencias as Attendee[];
    },
  });

  const filteredAttendees = attendees.filter(attendee => {
    const matchesSearch = attendee.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         attendee.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEvent = filterEventId === "all" || 
                        attendee.asistencias.some(a => a.eventoId === filterEventId);
    
    return matchesSearch && matchesEvent;
  });

  // Calcular paginación
  const totalPages = Math.ceil(filteredAttendees.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedAttendees = filteredAttendees.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambian los filtros
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleEventFilterChange = (value: string) => {
    setFilterEventId(value);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleToggleEvento = (ticketType: any) => {
    const exists = newAttendee.eventosSeleccionados.find(
      e => e.eventoId === ticketType.eventoId && e.tipoTicketId === ticketType.id
    );

    if (exists) {
      setNewAttendee({
        ...newAttendee,
        eventosSeleccionados: newAttendee.eventosSeleccionados.filter(
          e => !(e.eventoId === ticketType.eventoId && e.tipoTicketId === ticketType.id)
        )
      });
    } else {
      setNewAttendee({
        ...newAttendee,
        eventosSeleccionados: [...newAttendee.eventosSeleccionados, {
          eventoId: ticketType.eventoId,
          eventoNombre: ticketType.eventoNombre,
          tipoTicketId: ticketType.id,
          tipoTicketNombre: ticketType.tipo,
          precio: ticketType.precio
        }]
      });
    }
  };

  const handleCreateAttendee = async () => {
    if (!newAttendee.nombre || !newAttendee.apellido || !newAttendee.email || 
        !newAttendee.telefono || newAttendee.eventosSeleccionados.length === 0) {
      toast({
        title: "Error de validación",
        description: "Debes completar todos los campos obligatorios y seleccionar al menos un evento.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Verificar si el email ya existe
      const { data: existingAttendee } = await supabase
        .from('asistentes')
        .select('id')
        .eq('email', newAttendee.email.trim().toLowerCase())
        .maybeSingle();

      let attendeeId: string;

      if (existingAttendee) {
        toast({
          title: "Email existente",
          description: "Ya existe un asistente con ese email. Se agregarán los nuevos eventos a su registro.",
        });
        attendeeId = existingAttendee.id;
      } else {
        // Crear nuevo asistente
        const { data, error } = await supabase
          .from("asistentes")
          .insert({
            nombre: newAttendee.nombre.trim(),
            apellido: newAttendee.apellido.trim(),
            email: newAttendee.email.trim().toLowerCase(),
            telefono: newAttendee.telefono.trim(),
            documento_identidad: newAttendee.documentoIdentidad.trim() || null,
            fecha_nacimiento: newAttendee.fechaNacimiento || null
          })
          .select()
          .single();

        if (error) throw error;
        attendeeId = data.id;
      }

      // Verificar asistencias existentes
      const { data: existingAsistencias } = await supabase
        .from('asistencias')
        .select('evento_id, tipo_ticket_id')
        .eq('asistente_id', attendeeId);

      const existingKeys = new Set(
        (existingAsistencias || []).map(a => `${a.evento_id}-${a.tipo_ticket_id}`)
      );

      // Filtrar solo las asistencias nuevas
      const asistenciasToCreate = newAttendee.eventosSeleccionados
        .filter(evento => !existingKeys.has(`${evento.eventoId}-${evento.tipoTicketId}`))
        .map(evento => ({
          asistente_id: attendeeId,
          evento_id: evento.eventoId,
          tipo_ticket_id: evento.tipoTicketId,
          codigo_ticket: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          estado: 'confirmado'
        }));

      if (asistenciasToCreate.length > 0) {
        const { error: asistenciasError } = await supabase
          .from('asistencias')
          .insert(asistenciasToCreate);

        if (asistenciasError) throw asistenciasError;
      }

      const eventosYaExistentes = newAttendee.eventosSeleccionados.length - asistenciasToCreate.length;

      toast({
        title: "Asistente registrado",
        description: `${newAttendee.nombre} ha sido registrado con ${asistenciasToCreate.length} evento(s) nuevo(s).${eventosYaExistentes > 0 ? ` (${eventosYaExistentes} ya existían)` : ''}`,
      });

      setIsNewAttendeeOpen(false);
      setNewAttendee({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        documentoIdentidad: "",
        fechaNacimiento: "",
        eventosSeleccionados: []
      });
      refetch();
    } catch (error: any) {
      console.error("Error creating attendee:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar el asistente.",
        variant: "destructive",
      });
    }
  };

  const handleViewAttendee = (attendee: Attendee) => {
    setSelectedAttendee(attendee);
    setIsViewDialogOpen(true);
  };

  const handleEditAttendee = (attendee: Attendee) => {
    setSelectedAttendee(attendee);
    setEditAttendee({
      nombre: attendee.nombre,
      apellido: attendee.apellido,
      email: attendee.email,
      telefono: attendee.telefono,
      documentoIdentidad: attendee.documentoIdentidad || "",
      fechaNacimiento: attendee.fechaNacimiento || "",
      asistenciasActuales: attendee.asistencias,
      nuevasAsistencias: []
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleNuevaAsistencia = (ticketType: any) => {
    const exists = editAttendee.nuevasAsistencias.find(
      e => e.eventoId === ticketType.eventoId && e.tipoTicketId === ticketType.id
    );

    if (exists) {
      setEditAttendee({
        ...editAttendee,
        nuevasAsistencias: editAttendee.nuevasAsistencias.filter(
          e => !(e.eventoId === ticketType.eventoId && e.tipoTicketId === ticketType.id)
        )
      });
    } else {
      setEditAttendee({
        ...editAttendee,
        nuevasAsistencias: [...editAttendee.nuevasAsistencias, {
          eventoId: ticketType.eventoId,
          eventoNombre: ticketType.eventoNombre,
          tipoTicketId: ticketType.id,
          tipoTicketNombre: ticketType.tipo,
          precio: ticketType.precio
        }]
      });
    }
  };

  const handleRemoveAsistencia = async (asistenciaId: string) => {
    try {
      const { error } = await supabase
        .from('asistencias')
        .delete()
        .eq('id', asistenciaId);

      if (error) throw error;

      toast({
        title: "Asistencia eliminada",
        description: "La asistencia al evento ha sido eliminada.",
      });

      // Actualizar el estado local
      if (selectedAttendee) {
        setEditAttendee({
          ...editAttendee,
          asistenciasActuales: editAttendee.asistenciasActuales.filter(a => a.id !== asistenciaId)
        });
      }
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la asistencia.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAttendee = async () => {
    if (!selectedAttendee) return;

    try {
      // Actualizar información básica del asistente
      const { error: updateError } = await supabase
        .from("asistentes")
        .update({
          nombre: editAttendee.nombre.trim(),
          apellido: editAttendee.apellido.trim(),
          telefono: editAttendee.telefono.trim(),
          documento_identidad: editAttendee.documentoIdentidad.trim() || null,
          fecha_nacimiento: editAttendee.fechaNacimiento || null
        })
        .eq('id', selectedAttendee.id);

      if (updateError) throw updateError;

      // Agregar nuevas asistencias si hay
      if (editAttendee.nuevasAsistencias.length > 0) {
        const nuevasAsistencias = editAttendee.nuevasAsistencias.map(evento => ({
          asistente_id: selectedAttendee.id,
          evento_id: evento.eventoId,
          tipo_ticket_id: evento.tipoTicketId,
          codigo_ticket: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          estado: 'confirmado'
        }));

        const { error: asistenciasError } = await supabase
          .from('asistencias')
          .insert(nuevasAsistencias);

        if (asistenciasError) throw asistenciasError;
      }

      toast({
        title: "Asistente actualizado",
        description: `${editAttendee.nombre} ha sido actualizado exitosamente.`,
      });

      setIsEditDialogOpen(false);
      refetch();
    } catch (error: any) {
      console.error("Error updating attendee:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el asistente.",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedAttendees.length === paginatedAttendees.length) {
      setSelectedAttendees([]);
    } else {
      setSelectedAttendees(paginatedAttendees.map(a => a.id));
    }
  };

  const handleSelectAttendee = (attendeeId: string) => {
    if (selectedAttendees.includes(attendeeId)) {
      setSelectedAttendees(selectedAttendees.filter(id => id !== attendeeId));
    } else {
      setSelectedAttendees([...selectedAttendees, attendeeId]);
    }
  };

  const handleBulkAction = (action: 'exchange' | 'refund' | 'email') => {
    if (selectedAttendees.length === 0) {
      toast({
        title: "Sin selección",
        description: "Seleccione al menos un asistente para realizar esta acción.",
        variant: "destructive"
      });
      return;
    }
    setBulkAction(action);
    setIsBulkActionsOpen(true);
  };

  const executeBulkAction = async () => {
    const selectedAttendeesData = filteredAttendees.filter(a => selectedAttendees.includes(a.id));
    
    if (bulkAction === 'exchange') {
      toast({
        title: "Canje masivo",
        description: `Iniciando canje para ${selectedAttendees.length} asistente(s). Esta función abrirá el módulo de canjes.`,
      });
      // Aquí se podría redirigir a /exchanges con los asistentes preseleccionados
    } else if (bulkAction === 'refund') {
      toast({
        title: "Reembolso masivo",
        description: `Iniciando reembolso para ${selectedAttendees.length} asistente(s). Esta función abrirá el módulo de reembolsos.`,
      });
      // Aquí se podría redirigir a /refunds con los asistentes preseleccionados
    } else if (bulkAction === 'email') {
      toast({
        title: "Email marketing",
        description: `Preparando envío de email para ${selectedAttendees.length} asistente(s). Esta función abrirá el módulo de email marketing.`,
      });
      // Aquí se podría redirigir a /email-marketing con los asistentes preseleccionados
    }
    
    setIsBulkActionsOpen(false);
    setBulkAction(null);
    setSelectedAttendees([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmado":
      case "confirmed":
        return <Badge className="bg-green-500 text-white hover:bg-green-600">Confirmado</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>;
      case "cancelado":
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = [
    { title: "Total Asistentes", value: attendees.length.toString(), icon: Users },
    { title: "Total Asistencias", value: attendees.reduce((acc, a) => acc + a.asistencias.length, 0).toString(), icon: Users },
  ];

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Base de Datos de Asistentes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona la información de todos los asistentes a tus eventos
            </p>
          </div>
          <Dialog open={isNewAttendeeOpen} onOpenChange={setIsNewAttendeeOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Asistente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Asistente</DialogTitle>
                <DialogDescription>
                  Completa la información del asistente y selecciona los eventos a los que asistirá.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={newAttendee.nombre}
                      onChange={(e) => setNewAttendee({ ...newAttendee, nombre: e.target.value })}
                      placeholder="Juan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input
                      id="apellido"
                      value={newAttendee.apellido}
                      onChange={(e) => setNewAttendee({ ...newAttendee, apellido: e.target.value })}
                      placeholder="Pérez"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newAttendee.email}
                      onChange={(e) => setNewAttendee({ ...newAttendee, email: e.target.value })}
                      placeholder="juan@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      value={newAttendee.telefono}
                      onChange={(e) => setNewAttendee({ ...newAttendee, telefono: e.target.value })}
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documento">Documento de Identidad</Label>
                    <Input
                      id="documento"
                      value={newAttendee.documentoIdentidad}
                      onChange={(e) => setNewAttendee({ ...newAttendee, documentoIdentidad: e.target.value })}
                      placeholder="12345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                    <Input
                      id="fechaNacimiento"
                      type="date"
                      value={newAttendee.fechaNacimiento}
                      onChange={(e) => setNewAttendee({ ...newAttendee, fechaNacimiento: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Eventos y Entradas * (selecciona al menos uno)</Label>
                  <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                    {allTicketTypes.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        No hay tipos de tickets disponibles
                      </p>
                    ) : (
                      allTicketTypes.map((ticketType: any) => {
                        const isSelected = newAttendee.eventosSeleccionados.some(
                          e => e.eventoId === ticketType.eventoId && e.tipoTicketId === ticketType.id
                        );
                        return (
                          <div
                            key={ticketType.id}
                            className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                            onClick={() => handleToggleEvento(ticketType)}
                          >
                            <Checkbox checked={isSelected} />
                            <div className="flex-1">
                              <p className="font-medium">{ticketType.eventoNombre}</p>
                              <p className="text-sm text-muted-foreground">
                                {ticketType.tipo} - ${ticketType.precio}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {newAttendee.eventosSeleccionados.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {newAttendee.eventosSeleccionados.length} evento(s) seleccionado(s)
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCreateAttendee}
                  disabled={!newAttendee.nombre || !newAttendee.apellido || !newAttendee.email || 
                           !newAttendee.telefono || newAttendee.eventosSeleccionados.length === 0}
                >
                  Registrar Asistente
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
        )}

        {/* Filters and Actions */}
        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar asistentes..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterEventId}
                  onChange={(e) => handleEventFilterChange(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm min-w-[200px]"
                  title="Filtrar por evento"
                >
                  <option value="all">Todos los eventos</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.nombre}
                    </option>
                  ))}
                </select>
                <select
                  value={rowsPerPage}
                  onChange={(e) => handleRowsPerPageChange(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                  title="Filas por página"
                >
                  <option value="20">20 filas</option>
                  <option value="40">40 filas</option>
                  <option value="100">100 filas</option>
                  <option value="200">200 filas</option>
                  <option value="400">400 filas</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedAttendees.length > 0 && (
          <Card className="mb-4 border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-base">
                    {selectedAttendees.length} asistente(s) seleccionado(s)
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAttendees([])}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpiar selección
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('exchange')}
                  >
                    <Repeat className="w-4 h-4 mr-1" />
                    Canjear tickets
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('refund')}
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    Reembolsos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('email')}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Email marketing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendees Table */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>
              Asistentes ({filteredAttendees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAttendees.length === filteredAttendees.length && filteredAttendees.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Eventos</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                {isLoading ? (
                  <TableSkeleton 
                    columns={5} 
                    rows={5}
                    headers={["Nombre", "Email", "Teléfono", "Eventos", "Acción"]}
                  />
                ) : (
                  <TableBody>
                    {paginatedAttendees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-muted-foreground">
                            {searchTerm || filterEventId !== "all" 
                              ? "No se encontraron asistentes con los filtros aplicados"
                              : "No hay asistentes registrados"
                            }
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedAttendees.map((attendee) => (
                        <TableRow key={attendee.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedAttendees.includes(attendee.id)}
                              onCheckedChange={() => handleSelectAttendee(attendee.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {attendee.nombre} {attendee.apellido}
                          </TableCell>
                          <TableCell>{attendee.email}</TableCell>
                          <TableCell>{attendee.telefono}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {attendee.asistencias.map((asistencia, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {asistencia.evento}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewAttendee(attendee)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAttendee(attendee)}
                              >
                                <Edit className="w-4 h-4" />
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
            
            {/* Paginación */}
            {filteredAttendees.length > 0 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredAttendees.length)} de {filteredAttendees.length} asistentes
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Attendee Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Información del Asistente</DialogTitle>
            </DialogHeader>
            {selectedAttendee && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nombre Completo</Label>
                    <p className="font-medium">{selectedAttendee.nombre} {selectedAttendee.apellido}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedAttendee.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="font-medium">{selectedAttendee.telefono}</p>
                  </div>
                  {selectedAttendee.documentoIdentidad && (
                    <div>
                      <Label className="text-muted-foreground">Documento</Label>
                      <p className="font-medium">{selectedAttendee.documentoIdentidad}</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground mb-2">Eventos Asistidos ({selectedAttendee.asistencias.length})</Label>
                  <div className="space-y-2 mt-2">
                    {selectedAttendee.asistencias.map((asistencia) => (
                      <div key={asistencia.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{asistencia.evento}</p>
                            {asistencia.eventoTpId && (
                              <p className="text-xs text-muted-foreground">TP ID Evento: {asistencia.eventoTpId}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">{asistencia.tipoTicket}</p>
                            {asistencia.tipoTicketTpId && (
                              <p className="text-xs text-muted-foreground">TP ID Ticket: {asistencia.tipoTicketTpId}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Código: {asistencia.codigoTicket}
                            </p>
                          </div>
                          {getStatusBadge(asistencia.estado)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Attendee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Asistente</DialogTitle>
              <DialogDescription>
                Actualiza la información del asistente y gestiona sus asistencias a eventos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nombre">Nombre *</Label>
                  <Input
                    id="edit-nombre"
                    value={editAttendee.nombre}
                    onChange={(e) => setEditAttendee({ ...editAttendee, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-apellido">Apellido *</Label>
                  <Input
                    id="edit-apellido"
                    value={editAttendee.apellido}
                    onChange={(e) => setEditAttendee({ ...editAttendee, apellido: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editAttendee.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-telefono">Teléfono *</Label>
                  <Input
                    id="edit-telefono"
                    value={editAttendee.telefono}
                    onChange={(e) => setEditAttendee({ ...editAttendee, telefono: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2">Asistencias Actuales</Label>
                <div className="space-y-2 mt-2">
                  {editAttendee.asistenciasActuales.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay asistencias registradas</p>
                  ) : (
                    editAttendee.asistenciasActuales.map((asistencia) => (
                      <div key={asistencia.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{asistencia.evento}</p>
                          <p className="text-sm text-muted-foreground">{asistencia.tipoTicket}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAsistencia(asistencia.id)}
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Agregar Nuevos Eventos</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                  {allTicketTypes.map((ticketType: any) => {
                    const yaExiste = editAttendee.asistenciasActuales.some(
                      a => a.eventoId === ticketType.eventoId && a.tipoTicketId === ticketType.id
                    );
                    const isSelected = editAttendee.nuevasAsistencias.some(
                      e => e.eventoId === ticketType.eventoId && e.tipoTicketId === ticketType.id
                    );
                    
                    if (yaExiste) return null;

                    return (
                      <div
                        key={ticketType.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                        onClick={() => handleToggleNuevaAsistencia(ticketType)}
                      >
                        <Checkbox checked={isSelected} />
                        <div className="flex-1">
                          <p className="font-medium">{ticketType.eventoNombre}</p>
                          <p className="text-sm text-muted-foreground">
                            {ticketType.tipo} - ${ticketType.precio}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {editAttendee.nuevasAsistencias.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {editAttendee.nuevasAsistencias.length} nuevo(s) evento(s) seleccionado(s)
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleUpdateAttendee}
                disabled={!editAttendee.nombre || !editAttendee.apellido || !editAttendee.telefono}
              >
                Actualizar Asistente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Attendees;
