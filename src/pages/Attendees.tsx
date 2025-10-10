import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Upload, Filter, Users, Plus, User } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  StatsSkeleton, 
  TableSkeleton, 
  FormSkeleton, 
  SelectSkeleton 
} from "@/components/ui/skeleton-components";

type Attendee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  event: string;
  ticketType: string;
  status: "confirmed" | "pending" | "cancelled";
  registrationDate: string;
};


const Attendees = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isNewAttendeeOpen, setIsNewAttendeeOpen] = useState(false);
  
  const [newAttendee, setNewAttendee] = useState({
    nombre: "",
    email: "",
    telefono: "",
    documentoIdentidad: "",
    fechaNacimiento: "",
    ciudad: ""
  });


  // Queries para datos de Supabase

  const { data: attendees = [], isLoading } = useQuery({
    queryKey: ["attendees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asistentes')
        .select(`
          id,
          nombre,
          email,
          telefono,
          estado,
          created_at,
          eventos(nombre),
          tipos_tickets(tipo)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match Attendee type
      return data.map(attendee => ({
        id: attendee.id,
        name: attendee.nombre || '',
        email: attendee.email || '',
        phone: attendee.telefono || '',
        event: attendee.eventos?.nombre || 'Sin evento',
        ticketType: attendee.tipos_tickets?.tipo || 'Sin tipo',
        status: attendee.estado as "confirmed" | "pending" | "cancelled",
        registrationDate: new Date(attendee.created_at).toISOString().split('T')[0]
      }));
    },
  });

  const filteredAttendees = attendees.filter(attendee => {
    const matchesSearch = (attendee.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (attendee.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (attendee.event?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || attendee.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleCreateAttendee = async () => {
    try {
      // Generar código único de ticket
      const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from("asistentes")
        .insert({
          nombre: newAttendee.nombre,
          email: newAttendee.email,
          telefono: newAttendee.telefono,
          evento_id: null, // Sin evento específico
          tipo_ticket_id: null, // Sin tipo de ticket específico
          codigo_ticket: ticketCode,
          documento_identidad: newAttendee.documentoIdentidad,
          fecha_nacimiento: newAttendee.fechaNacimiento || null,
          ciudad: newAttendee.ciudad,
          estado: "confirmado"
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Asistente registrado",
        description: `${newAttendee.nombre} ha sido registrado exitosamente. Código: ${ticketCode}`,
      });

      setIsNewAttendeeOpen(false);
      setNewAttendee({
        nombre: "",
        email: "",
        telefono: "",
        documentoIdentidad: "",
        fechaNacimiento: "",
        ciudad: ""
      });
    } catch (error) {
      console.error("Error creating attendee:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el asistente. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500 text-white hover:bg-green-600">Confirmado</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = [
    { title: "Total Asistentes", value: attendees.length.toString(), icon: Users },
    { title: "Confirmados", value: attendees.filter(a => a.status === "confirmed").length.toString(), icon: Users },
    { title: "Pendientes", value: attendees.filter(a => a.status === "pending").length.toString(), icon: Users },
    { title: "Cancelados", value: attendees.filter(a => a.status === "cancelled").length.toString(), icon: Users },
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Registrar Nuevo Asistente
                </DialogTitle>
                <DialogDescription>
                  Completa la información del asistente para registrarlo en el evento.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Información Personal */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo *</Label>
                    <Input
                      id="nombre"
                      value={newAttendee.nombre}
                      onChange={(e) => setNewAttendee({ ...newAttendee, nombre: e.target.value })}
                      placeholder="Juan Pérez"
                    />
                  </div>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      value={newAttendee.telefono}
                      onChange={(e) => setNewAttendee({ ...newAttendee, telefono: e.target.value })}
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documento">Documento de Identidad</Label>
                    <Input
                      id="documento"
                      value={newAttendee.documentoIdentidad}
                      onChange={(e) => setNewAttendee({ ...newAttendee, documentoIdentidad: e.target.value })}
                      placeholder="12345678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                    <Input
                      id="fechaNacimiento"
                      type="date"
                      value={newAttendee.fechaNacimiento}
                      onChange={(e) => setNewAttendee({ ...newAttendee, fechaNacimiento: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input
                      id="ciudad"
                      value={newAttendee.ciudad}
                      onChange={(e) => setNewAttendee({ ...newAttendee, ciudad: e.target.value })}
                      placeholder="Bogotá"
                    />
                  </div>
                </div>

              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCreateAttendee}
                  disabled={!newAttendee.nombre || !newAttendee.email || !newAttendee.telefono}
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
        )}

        {/* Filters and Actions */}
        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar asistentes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                  title="Filtrar asistentes por estado"
                >
                  <option value="all">Todos los estados</option>
                  <option value="confirmed">Confirmados</option>
                  <option value="pending">Pendientes</option>
                  <option value="cancelled">Cancelados</option>
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
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Tipo de Ticket</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                  </TableRow>
                </TableHeader>
                {isLoading ? (
                  <TableSkeleton 
                    columns={7} 
                    rows={5}
                    headers={["Nombre", "Email", "Teléfono", "Evento", "Tipo de Ticket", "Estado", "Fecha de Registro"]}
                  />
                ) : (
                  <TableBody>
                    {filteredAttendees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-muted-foreground">
                            {searchTerm || filterStatus !== "all" 
                              ? "No se encontraron asistentes con los filtros aplicados"
                              : "No hay asistentes registrados"
                            }
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAttendees.map((attendee) => (
                        <TableRow key={attendee.id}>
                          <TableCell className="font-medium">{attendee.name}</TableCell>
                          <TableCell>{attendee.email}</TableCell>
                          <TableCell>{attendee.phone}</TableCell>
                          <TableCell>{attendee.event}</TableCell>
                          <TableCell>{attendee.ticketType}</TableCell>
                          <TableCell>{getStatusBadge(attendee.status)}</TableCell>
                          <TableCell>
                            {new Date(attendee.registrationDate).toLocaleDateString()}
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
      </div>
    </Layout>
  );
};

export default Attendees;
