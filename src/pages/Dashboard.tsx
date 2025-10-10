import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Calendar, Users, TrendingUp, DollarSign } from "lucide-react";

const stats = [
  { title: "Eventos Activos", value: "12", icon: Calendar, change: "+2 este mes", trend: "up" },
  { title: "Asistentes Totales", value: "24,567", icon: Users, change: "+1,234 este mes", trend: "up" },
  { title: "Tasa de Conversión", value: "68%", icon: TrendingUp, change: "+5% vs mes anterior", trend: "up" },
  { title: "Ingresos", value: "$89,430", icon: DollarSign, change: "+12% vs mes anterior", trend: "up" },
];

const recentEvents = [
  { name: "Concierto Rock en el Parque", date: "15 Oct 2025", attendees: 2500, status: "active" },
  { name: "Festival Electrónica", date: "22 Oct 2025", attendees: 5000, status: "active" },
  { name: "Jazz Night", date: "28 Oct 2025", attendees: 800, status: "upcoming" },
  { name: "Reggaeton Fest", date: "5 Nov 2025", attendees: 3200, status: "upcoming" },
];

const Dashboard = () => {
  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Resumen general de tu gestión de eventos
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-none shadow-lg hover:shadow-xl transition-shadow">
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
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Events */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Eventos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                  </div>
                  <div className="text-right mr-6">
                    <p className="font-semibold">{event.attendees.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">asistentes</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      event.status === "active"
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {event.status === "active" ? "Activo" : "Próximo"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
