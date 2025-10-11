import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Calendar, Users, TrendingUp, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Campaign = {
  id: string;
  nombre?: string;
  asunto: string;
  contenido: string;
  contenido_html: string;
  tipo?: string;
  estado: string;
  audiencia?: string;
  filtros_audiencia?: any;
  plantilla_id?: string;
  configuracion_envio?: any;
  fecha_programada?: string;
  fecha_enviada?: string;
  creado_por?: string;
  enviados: number;
  abiertos: number;
  clicks: number;
  rebotes: number;
  desuscritos: number;
  created_at: string;
  updated_at: string;
};

export const CampaignHistoryTab = () => {
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanas_email")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as Campaign[];
    },
  });

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      borrador: { variant: "outline", label: "Borrador" },
      enviando: { variant: "secondary", label: "Enviando" },
      enviada: { variant: "default", label: "Enviada" },
      programada: { variant: "outline", label: "Programada" },
    };
    
    return badges[estado] || { variant: "outline", label: estado };
  };

  const calcularTasaApertura = (abiertos: number, enviados: number) => {
    if (enviados === 0) return "0%";
    return `${Math.round((abiertos / enviados) * 100)}%`;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Cargando campañas...</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay campañas</h3>
        <p className="text-muted-foreground mb-4">
          Las campañas que crees aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Campañas</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enviadas</p>
                <p className="text-2xl font-bold">
                  {campaigns.filter(c => c.estado === 'enviada').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Destinatarios</p>
                <p className="text-2xl font-bold">
                  {campaigns.reduce((sum, c) => sum + (c.enviados + c.abiertos || 0), 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa Apertura Promedio</p>
                <p className="text-2xl font-bold">
                  {campaigns.length > 0 
                    ? `${Math.round(
                        campaigns.reduce((sum, c) => {
                          const tasa = c.enviados > 0 ? (c.abiertos / c.enviados) * 100 : 0;
                          return sum + tasa;
                        }, 0) / campaigns.length
                      )}%`
                    : "0%"
                  }
                </p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de campañas */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Historial de Campañas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaña</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Destinatarios</TableHead>
                  <TableHead className="text-center">Enviados</TableHead>
                  <TableHead className="text-center">Abiertos</TableHead>
                  <TableHead className="text-center">Tasa Apertura</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const estadoBadge = getEstadoBadge(campaign.estado);
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.nombre || campaign.asunto}</div>
                          <div className="text-sm text-muted-foreground">{campaign.asunto}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={estadoBadge.variant}>
                          {estadoBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {campaign.enviados + campaign.abiertos || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {campaign.enviados || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {campaign.abiertos || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={campaign.abiertos > 0 ? "text-green-600 font-semibold" : ""}>
                          {calcularTasaApertura(campaign.abiertos, campaign.enviados)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {campaign.fecha_enviada 
                            ? format(new Date(campaign.fecha_enviada), "dd MMM yyyy, HH:mm", { locale: es })
                            : format(new Date(campaign.created_at), "dd MMM yyyy, HH:mm", { locale: es })
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
