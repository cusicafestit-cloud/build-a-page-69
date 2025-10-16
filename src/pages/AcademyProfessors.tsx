import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateProfesorDialog } from "@/components/academy/CreateProfesorDialog";
import { EditProfesorDialog } from "@/components/academy/EditProfesorDialog";

const AcademyProfessors = () => {
  const { data: profesores = [], isLoading } = useQuery({
    queryKey: ["profesores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profesores")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/academy">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Academy
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Profesores
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona el equipo de instructores y profesores
              </p>
            </div>
          </div>
          <CreateProfesorDialog />
        </div>

        {/* Profesores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : profesores.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <UserCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay profesores registrados. Agrega uno nuevo para comenzar.
              </p>
            </div>
          ) : (
            profesores.map((profesor) => (
              <Card key={profesor.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 rounded-t-lg flex items-center justify-center overflow-hidden">
                  {profesor.foto_url ? (
                    <img
                      src={profesor.foto_url}
                      alt={profesor.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-24 h-24 text-primary" />
                  )}
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{profesor.nombre}</CardTitle>
                    <Badge variant={profesor.activo ? "default" : "secondary"}>
                      {profesor.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  {profesor.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {profesor.bio}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profesor.especialidades && profesor.especialidades.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {profesor.especialidades.map((esp, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {esp}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="pt-2">
                      <EditProfesorDialog profesor={profesor} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AcademyProfessors;
