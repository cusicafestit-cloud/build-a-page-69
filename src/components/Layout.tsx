import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Repeat, 
  DollarSign, 
  Mail,
  Music,
  GraduationCap,
  UserCog,
  Database,
  Settings,
  Ticket
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/events", label: "Eventos", icon: Calendar },
  { to: "/attendees", label: "Base de Datos", icon: Users },
  { to: "/database-validation", label: "Validación DB", icon: Database },
  { to: "/exchanges", label: "Canjes", icon: Repeat },
  { to: "/canje", label: "Canjes Públicos", icon: Ticket },
  { to: "/refunds", label: "Reembolsos", icon: DollarSign },
  { to: "/email", label: "Email Marketing", icon: Mail },
  { to: "/academy", label: "Academy", icon: GraduationCap },
  { to: "/users", label: "Usuarios", icon: UserCog },
  { to: "/settings", label: "Configuración", icon: Settings },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border fixed h-full z-50">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">Cusica</h1>
              <p className="text-xs text-sidebar-foreground/60">Event Management</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
};
