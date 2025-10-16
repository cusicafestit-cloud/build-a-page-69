import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import cusicaLogo from "@/assets/cusica-logo.jpg";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Repeat, 
  DollarSign, 
  Mail,
  GraduationCap,
  UserCog,
  Database,
  Settings,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/events", label: "Eventos", icon: Calendar },
  { to: "/attendees", label: "Base de Datos", icon: Users },
  { to: "/database-validation", label: "Validación DB", icon: Database },
  { to: "/exchanges", label: "Canjes", icon: Repeat },
  { to: "/refunds", label: "Reembolsos", icon: DollarSign },
  { to: "/email", label: "Email Marketing", icon: Mail },
  { to: "/academy", label: "Academy", icon: GraduationCap },
  { to: "/users", label: "Usuarios", icon: UserCog },
  { to: "/settings", label: "Configuración", icon: Settings },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <img src={cusicaLogo} alt="Cusica Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Cusica</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserProfileDropdown />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-sidebar-foreground"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block w-64 bg-sidebar border-r border-sidebar-border fixed h-full z-50">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <img src={cusicaLogo} alt="Cusica Logo" className="w-full h-full object-cover" />
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

      {/* Sidebar - Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <aside 
            className="w-64 bg-sidebar border-r border-sidebar-border h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pt-20">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
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
        </div>
      )}

      {/* Desktop Header */}
      <div className="hidden lg:block fixed top-0 right-0 left-64 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border z-40">
        <div className="flex items-center justify-end h-full px-6">
          <UserProfileDropdown />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-16 w-full">
        {children}
      </main>
    </div>
  );
};
