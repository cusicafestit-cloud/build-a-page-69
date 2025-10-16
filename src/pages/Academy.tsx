import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, BookOpen, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateCourseDialog } from "@/components/academy/CreateCourseDialog";

const Academy = () => {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select(`
          *,
          estudiantes_cursos(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const stats = [
    { title: "Total Cursos", value: courses.length.toString(), icon: BookOpen },
    { title: "Estudiantes Activos", value: courses.reduce((acc, c) => acc + (c.estudiantes_cursos?.[0]?.count || 0), 0).toString(), icon: Users },
    { title: "Lecciones", value: "0", icon: Play },
    { title: "Tasa Completación", value: "0%", icon: GraduationCap },
  ];

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Cusica Academy
            </h1>
            <p className="text-muted-foreground mt-1">
              Plataforma educativa para músicos y productores
            </p>
          </div>
          <CreateCourseDialog />
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

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay cursos disponibles. Crea uno nuevo para comenzar.</p>
            </div>
          ) : (
            courses.map((course) => (
              <Card key={course.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-t-lg flex items-center justify-center">
                  <GraduationCap className="w-12 h-12 text-primary" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{course.titulo}</CardTitle>
                    <Badge variant={course.estado === "activo" ? "default" : "secondary"}>
                      {course.estado === "activo" ? "Activo" : "Borrador"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {course.descripcion_corta || course.descripcion?.substring(0, 100)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{course.estudiantes_cursos?.[0]?.count || 0} estudiantes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-muted-foreground" />
                        <span>0 lecciones</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Editar
                      </Button>
                      <Link to={`/academy/students?curso=${course.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Ver Estudiantes
                        </Button>
                      </Link>
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

export default Academy;
