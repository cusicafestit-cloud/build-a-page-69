import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send, Eye, Search, Users, Mail, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate, replaceTemplateVariables } from "@/types/email-templates";
import { CampaignFormData } from "@/types/email-campaigns";
import { cn } from "@/lib/utils";

type Attendee = {
  id: string;
  nombre: string;
  apellido?: string;
  email: string;
  evento_id?: string;
  codigo_ticket?: string;
};

type Event = {
  id: string;
  nombre: string;
};

export const CampaignsTab = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Estados
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");

  // Query de plantillas activas
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["email-templates-for-campaign"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plantillas_email")
        .select("*")
        .eq("activa", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as EmailTemplate[];
    },
  });

  // Query de asistentes con emails válidos
  const { data: attendees = [], isLoading: isLoadingAttendees } = useQuery({
    queryKey: ["attendees-for-campaign", filterEvent],
    queryFn: async () => {
      let query = supabase
        .from("asistentes")
        .select(`
          id,
          nombre,
          apellido,
          email,
          evento_id,
          codigo_ticket,
          eventos:evento_id(nombre)
        `)
        .not("email", "is", null)
        .order("nombre");
      
      if (filterEvent !== "all") {
        query = query.eq("evento_id", filterEvent);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((a: any) => ({
        id: a.id,
        nombre: a.nombre,
        apellido: a.apellido,
        email: a.email,
        evento_id: a.evento_id,
        evento_nombre: a.eventos?.nombre,
        codigo_ticket: a.codigo_ticket,
      }));
    },
  });

  // Query de eventos para filtro
  const { data: events = [] } = useQuery({
    queryKey: ["events-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos")
        .select("id, nombre")
        .order("nombre");
      
      if (error) throw error;
      return (data || []) as Event[];
    },
  });

  // Mutation de crear campaña
  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      // Validaciones
      if (!selectedTemplateId) {
        throw new Error("Selecciona una plantilla de email");
      }
      if (!campaignSubject.trim()) {
        throw new Error("El asunto del email es requerido");
      }
      if (selectedAttendees.length === 0) {
        throw new Error("Selecciona al menos un destinatario");
      }
      if (!campaignName.trim()) {
        throw new Error("El nombre de la campaña es requerido");
      }

      // Obtener plantilla
      const { data: template, error: templateError } = await supabase
        .from("plantillas_email")
        .select("*")
        .eq("id", selectedTemplateId)
        .single();

      if (templateError) throw templateError;

      // Crear campaña
      const { data: campaign, error: campaignError } = await supabase
        .from("campanas_email")
        .insert({
          asunto: campaignSubject,
          plantilla_id: selectedTemplateId,
          contenido: campaignSubject,
          contenido_html: template.contenido_html,
          creado_por: (await supabase.auth.getUser()).data.user?.id || '',
          audiencia: 'segmento',
          enviados: 0,
          abiertos: 0,
          clicks: 0,
          estado: 'borrador',
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Crear registros de envíos (pendientes)
      const selectedAttendeesData = attendees.filter(a => selectedAttendees.includes(a.id));
      
      const envios = selectedAttendeesData.map(attendee => ({
        campana_id: campaign.id,
        suscriptor_id: attendee.id,
        email_destinatario: attendee.email,
        estado: 'pendiente',
      }));

      const { error: enviosError } = await supabase
        .from("envios_email")
        .insert(envios);

      if (enviosError) throw enviosError;

      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Campaña creada",
        description: `La campaña "${campaignName}" ha sido guardada como borrador con ${selectedAttendees.length} destinatarios.`,
      });
      
      // Resetear formulario
      setSelectedTemplateId(null);
      setSelectedAttendees([]);
      setCampaignName("");
      setCampaignSubject("");
      setSearchQuery("");
    },
    onError: (error: any) => {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la campaña.",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplateId(template.id);
    if (template.asunto_predeterminado && !campaignSubject) {
      setCampaignSubject(template.asunto_predeterminado);
    }
  };

  const handleToggleAttendee = (attendeeId: string) => {
    setSelectedAttendees(prev =>
      prev.includes(attendeeId)
        ? prev.filter(id => id !== attendeeId)
        : [...prev, attendeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAttendees.length === filteredAttendees.length) {
      setSelectedAttendees([]);
    } else {
      setSelectedAttendees(filteredAttendees.map(a => a.id));
    }
  };

  // Filtrado de asistentes
  const filteredAttendees = attendees.filter(a => {
    const matchesSearch = 
      a.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.apellido && a.apellido.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Preview del email
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const firstRecipient = attendees.find(a => selectedAttendees.includes(a.id));
  
  const previewHtml = selectedTemplate 
    ? replaceTemplateVariables(selectedTemplate.contenido_html, {
        nombre: firstRecipient?.nombre || "Juan",
        email: firstRecipient?.email || "destinatario@email.com",
        evento: firstRecipient?.evento_nombre || "Mi Evento",
        fecha: new Date().toLocaleDateString(),
        lugar: "Arena México",
        codigo_ticket: firstRecipient?.codigo_ticket || "TICK-12345"
      })
    : "<div style='padding: 40px; text-align: center; color: #6b7280;'><p>Selecciona una plantilla para ver el preview del email</p></div>";

  const isFormValid = selectedTemplateId && campaignSubject.trim() && selectedAttendees.length > 0 && campaignName.trim();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Columna izquierda: Formulario */}
      <div className="space-y-6">
        {/* 1. Nombre de la campaña */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              1. Información de la Campaña
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="campaign-name">Nombre de la Campaña *</Label>
              <Input
                id="campaign-name"
                placeholder="Ej: Newsletter Diciembre 2025"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Seleccionar Plantilla */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              2. Seleccionar Plantilla
              {selectedTemplateId && <Badge variant="secondary">Seleccionada</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTemplates ? (
              <div className="text-center py-8 text-muted-foreground">Cargando plantillas...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay plantillas disponibles</p>
                <p className="text-sm text-muted-foreground mt-2">Crea una plantilla primero en el tab "Plantillas"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {templates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors",
                      selectedTemplateId === template.id && "border-primary bg-primary/5 ring-2 ring-primary/20"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{template.nombre}</h4>
                        {template.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1">{template.descripcion}</p>
                        )}
                        {template.asunto_predeterminado && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Asunto:</strong> {template.asunto_predeterminado}
                          </p>
                        )}
                      </div>
                      {selectedTemplateId === template.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Seleccionar Destinatarios */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                3. Seleccionar Destinatarios
              </span>
              <Badge variant="secondary">
                {selectedAttendees.length} de {filteredAttendees.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="flex gap-4">
              <Select value={filterEvent} onValueChange={setFilterEvent}>
                <SelectTrigger className="w-[200px]" title="Filtrar por evento">
                  <SelectValue placeholder="Todos los eventos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los eventos</SelectItem>
                  {events.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tabla de asistentes */}
            {isLoadingAttendees ? (
              <div className="text-center py-8 text-muted-foreground">Cargando asistentes...</div>
            ) : filteredAttendees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron asistentes</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchQuery ? "Intenta ajustar los filtros" : "No hay asistentes registrados con email"}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedAttendees.length === filteredAttendees.length && filteredAttendees.length > 0}
                            onCheckedChange={handleSelectAll}
                            title="Seleccionar todos"
                          />
                        </TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Evento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttendees.map(attendee => (
                        <TableRow key={attendee.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedAttendees.includes(attendee.id)}
                              onCheckedChange={() => handleToggleAttendee(attendee.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {attendee.nombre} {attendee.apellido || ""}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{attendee.email}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {attendee.evento_nombre || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botón de crear */}
        <Button
          onClick={() => createCampaignMutation.mutate()}
          disabled={!isFormValid || createCampaignMutation.isPending}
          className="w-full"
          size="lg"
        >
          <Send className="w-4 h-4 mr-2" />
          {createCampaignMutation.isPending ? "Creando campaña..." : "Crear Campaña (Borrador)"}
        </Button>
      </div>

      {/* Columna derecha: Preview */}
      <div className="sticky top-8">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Vista Previa del Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="campaign-subject">Asunto del Email *</Label>
              <Input
                id="campaign-subject"
                value={campaignSubject}
                onChange={e => setCampaignSubject(e.target.value)}
                placeholder="Asunto del email..."
              />
            </div>
            
            <div className="border rounded-lg overflow-hidden bg-muted/20" style={{height: "600px"}}>
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
                title="Email Preview"
              />
            </div>
            
            {firstRecipient && (
              <p className="text-sm text-muted-foreground">
                Preview con datos de: <strong>{firstRecipient.nombre}</strong> ({firstRecipient.email})
              </p>
            )}
            
            {!selectedTemplateId && (
              <p className="text-sm text-center text-muted-foreground py-4">
                Selecciona una plantilla para ver el preview
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
