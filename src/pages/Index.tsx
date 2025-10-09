import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Cusica Platform</h1>
            <p className="text-sm text-muted-foreground">Gestión de eventos y canjes</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Cerrar Sesión
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground">
            ¡Bienvenido a Cusica Platform!
          </h2>
          <p className="mb-8 text-xl text-muted-foreground">
            {user?.email && `Has iniciado sesión como: ${user.email}`}
          </p>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Tu plataforma de gestión de eventos y canjes está lista.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
