import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Calendar, Users, TrendingUp, DollarSign, Ticket, Repeat } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    eventosActivos: 0,
    asistentesTotales: 0,
    canjesPendientes: 0,
    reembolsosMonto: 0,
  });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch eventos activos
      const { data: eventos, error: eventosError } = await supabase
        .from("eventos")
        .select("*")
        .in("estado", ["proximo", "activo"])
        .order("fecha", { ascending: true });

      if (eventosError) throw eventosError;

      // Fetch asistentes totales
      const { count: asistentesCount, error: asistentesError } = await supabase
        .from("asistentes")
        .select("*", { count: "exact", head: true });

      if (asistentesError) throw asistentesError;

      // Fetch canjes pendientes
      const { count: canjesCount, error: canjesError } = await supabase
        .from("canjes")
        .select("*", { count: "exact", head: true })
        .eq("estado", "pendiente");

      if (canjesError) throw canjesError;

      // Fetch reembolsos aprobados monto total
      const { data: reembolsos, error: reembolsosError } = await supabase
        .from("reembolsos")
        .select("monto")
        .eq("estado", "aprobado");

      if (reembolsosError) throw reembolsosError;

      const montoTotal = reembolsos?.reduce((sum, r) => sum + Number(r.monto || 0), 0) || 0;

      setStats({
        eventosActivos: eventos?.length || 0,
        asistentesTotales: asistentesCount || 0,
        canjesPendientes: canjesCount || 0,
        reembolsosMonto: montoTotal,
      });

      // Set recent events (limit to 5)
      setRecentEvents(eventos?.slice(0, 5) || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const statsData = [
    { 
      title: "Eventos Activos", 
      value: stats.eventosActivos.toString(), 
      icon: Calendar, 
      change: "Total de eventos próximos",
    },
    { 
      title: "Asistentes Totales", 
      value: stats.asistentesTotales.toLocaleString(), 
      icon: Users, 
      change: "Registrados en el sistema",
    },
    { 
      title: "Canjes Pendientes", 
      value: stats.canjesPendientes.toString(), 
      icon: Repeat, 
      change: "Requieren atención",
    },
    { 
      title: "Reembolsos Aprobados", 
      value: `$${stats.reembolsosMonto.toLocaleString()}`, 
      icon: DollarSign, 
      change: "Monto total aprobado",
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Resumen general de tu gestión de eventos
              </p>
            </div>
            <Link to="/canje">
              <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 w-full md:w-auto">
                <Ticket className="w-4 h-4 mr-2" />
                Canjes Públicos
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {statsData.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Events */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Eventos Próximos</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay eventos próximos registrados
              </p>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-3 md:gap-0"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm md:text-base">{event.nombre}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {format(new Date(event.fecha), "d 'de' MMMM, yyyy", { locale: es })} • {event.lugar}
                      </p>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <div className="text-left md:text-right md:mr-6">
                        <p className="font-semibold text-sm md:text-base">{event.vendidos?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">vendidos</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          event.estado === "activo"
                            ? "bg-primary/10 text-primary"
                            : "bg-accent/10 text-accent"
                        }`}
                      >
                        {event.estado === "activo" ? "Activo" : "Próximo"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
