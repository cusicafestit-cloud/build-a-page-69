import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Music, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Music className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Cusica
          </h1>
        </div>
        
        <div className="mb-8">
          <h2 className="text-6xl font-bold text-primary mb-4">404</h2>
          <h3 className="text-2xl font-semibold mb-2">Página no encontrada</h3>
          <p className="text-muted-foreground">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            asChild
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Ir al Dashboard
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver Atrás
          </Button>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>Ruta solicitada: <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code></p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
