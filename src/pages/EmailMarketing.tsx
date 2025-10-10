import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Users, Eye, BarChart3, Plus } from "lucide-react";
import { useState } from "react";

const EmailMarketing = () => {
  const [newCampaign, setNewCampaign] = useState({
    subject: "",
    content: "",
    audience: "all"
  });

  const campaigns = [
    { id: "1", subject: "¡Nuevo evento disponible!", sent: 1250, opened: 890, clicked: 234, status: "sent" },
    { id: "2", subject: "Recordatorio: Festival de Rock", sent: 2100, opened: 1456, clicked: 567, status: "sent" },
    { id: "3", subject: "Oferta especial VIP", sent: 0, opened: 0, clicked: 0, status: "draft" }
  ];

  const stats = [
    { title: "Campañas Enviadas", value: "24", icon: Mail },
    { title: "Emails Enviados", value: "15,420", icon: Send },
    { title: "Tasa de Apertura", value: "68%", icon: Eye },
    { title: "Suscriptores", value: "3,250", icon: Users },
  ];

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Email Marketing
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus campañas de email marketing
          </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Campaign */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Nueva Campaña
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Asunto</label>
                <Input
                  placeholder="Asunto del email..."
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Audiencia</label>
                <select
                  value={newCampaign.audience}
                  onChange={(e) => setNewCampaign({ ...newCampaign, audience: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">Todos los suscriptores</option>
                  <option value="rock-fans">Fans de Rock</option>
                  <option value="jazz-fans">Fans de Jazz</option>
                  <option value="vip">Clientes VIP</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Contenido</label>
                <Textarea
                  placeholder="Escribe tu mensaje aquí..."
                  value={newCampaign.content}
                  onChange={(e) => setNewCampaign({ ...newCampaign, content: e.target.value })}
                  rows={6}
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Ahora
                </Button>
                <Button variant="outline">Guardar Borrador</Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Campaigns */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Campañas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{campaign.subject}</h3>
                      <Badge variant={campaign.status === "sent" ? "default" : "secondary"}>
                        {campaign.status === "sent" ? "Enviado" : "Borrador"}
                      </Badge>
                    </div>
                    {campaign.status === "sent" && (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Enviados</div>
                          <div className="font-medium">{campaign.sent.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Abiertos</div>
                          <div className="font-medium">{campaign.opened.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Clicks</div>
                          <div className="font-medium">{campaign.clicked.toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default EmailMarketing;
