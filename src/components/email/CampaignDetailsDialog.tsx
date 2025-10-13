import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Users, Eye, MousePointerClick, XCircle, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Campaign = {
  id: string;
  nombre?: string;
  asunto: string;
  estado: string;
  enviados: number;
  abiertos: number;
  clicks: number;
  rebotes: number;
  desuscritos: number;
  fecha_enviada?: string;
  created_at: string;
};

type EmailSent = {
  id: string;
  email_destinatario: string;
  estado: string;
  fecha_envio: string;
  fecha_entrega?: string;
  fecha_apertura?: string;
  fecha_click?: string;
  numero_aperturas: number;
  numero_clicks: number;
};

type CampaignDetailsDialogProps = {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CampaignDetailsDialog = ({ campaign, open, onOpenChange }: CampaignDetailsDialogProps) => {
  const { data: recipients = [], isLoading } = useQuery({
    queryKey: ["campaign-recipients", campaign?.id],
    queryFn: async () => {
      if (!campaign?.id) return [];
      
      const { data, error } = await supabase
        .from("envios_email")
        .select("*")
        .eq("campana_id", campaign.id)
        .order("fecha_envio", { ascending: false });
      
      if (error) throw error;
      return (data || []) as EmailSent[];
    },
    enabled: !!campaign?.id && open,
  });

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      enviado: { variant: "outline", label: "Enviado" },
      entregado: { variant: "secondary", label: "Entregado" },
      abierto: { variant: "default", label: "Abierto" },
      clickeado: { variant: "default", label: "Clickeado" },
      rebotado: { variant: "destructive", label: "Rebotado" },
      desuscrito: { variant: "destructive", label: "Desuscrito" },
    };
    
    return badges[estado] || { variant: "outline", label: estado };
  };

  if (!campaign) return null;

  const tasaApertura = campaign.enviados > 0 
    ? Math.round((campaign.abiertos / campaign.enviados) * 100) 
    : 0;

  const tasaClicks = campaign.enviados > 0 
    ? Math.round((campaign.clicks / campaign.enviados) * 100) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {campaign.nombre || campaign.asunto}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estadísticas de la campaña */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col items-center text-center">
                  <Mail className="w-6 h-6 text-muted-foreground mb-2" />
                  <p className="text-2xl font-bold">{campaign.enviados}</p>
                  <p className="text-xs text-muted-foreground">Enviados</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col items-center text-center">
                  <Eye className="w-6 h-6 text-blue-500 mb-2" />
                  <p className="text-2xl font-bold">{campaign.abiertos}</p>
                  <p className="text-xs text-muted-foreground">Abiertos ({tasaApertura}%)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col items-center text-center">
                  <MousePointerClick className="w-6 h-6 text-green-500 mb-2" />
                  <p className="text-2xl font-bold">{campaign.clicks}</p>
                  <p className="text-xs text-muted-foreground">Clicks ({tasaClicks}%)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col items-center text-center">
                  <XCircle className="w-6 h-6 text-red-500 mb-2" />
                  <p className="text-2xl font-bold">{campaign.rebotes}</p>
                  <p className="text-xs text-muted-foreground">Rebotes</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col items-center text-center">
                  <Calendar className="w-6 h-6 text-purple-500 mb-2" />
                  <p className="text-sm font-semibold">
                    {campaign.fecha_enviada 
                      ? format(new Date(campaign.fecha_enviada), "dd MMM yyyy", { locale: es })
                      : format(new Date(campaign.created_at), "dd MMM yyyy", { locale: es })
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de destinatarios */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Destinatarios ({recipients.length})
            </h3>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Cargando destinatarios...</p>
              </div>
            ) : recipients.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No hay destinatarios registrados</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-center">Aperturas</TableHead>
                        <TableHead className="text-center">Clicks</TableHead>
                        <TableHead>Fecha Envío</TableHead>
                        <TableHead>Última Actividad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipients.map((recipient) => {
                        const estadoBadge = getEstadoBadge(recipient.estado);
                        const ultimaActividad = recipient.fecha_click || recipient.fecha_apertura || recipient.fecha_entrega || recipient.fecha_envio;
                        
                        return (
                          <TableRow key={recipient.id}>
                            <TableCell className="font-medium">
                              {recipient.email_destinatario}
                            </TableCell>
                            <TableCell>
                              <Badge variant={estadoBadge.variant}>
                                {estadoBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {recipient.numero_aperturas}
                            </TableCell>
                            <TableCell className="text-center">
                              {recipient.numero_clicks}
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(recipient.fecha_envio), "dd/MM/yy HH:mm", { locale: es })}
                            </TableCell>
                            <TableCell className="text-sm">
                              {ultimaActividad 
                                ? format(new Date(ultimaActividad), "dd/MM/yy HH:mm", { locale: es })
                                : "-"
                              }
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
