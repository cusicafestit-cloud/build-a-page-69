import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Users, BookOpen, Award, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateStudentDialog } from "@/components/academy/CreateStudentDialog";

const CourseStudents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  const cursoId = searchParams.get("curso");

  const { data: courseData } = useQuery({
    queryKey: ["course", cursoId],
    queryFn: async () => {
      if (!cursoId) return null;
      const { data, error } = await supabase
        .from("cursos")
        .select("titulo")
        .eq("id", cursoId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!cursoId,
  });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["course-students", cursoId],
    queryFn: async () => {
      if (!cursoId) return [];
      const { data, error } = await supabase
        .from("estudiantes_cursos")
        .select("*")
        .eq("curso_id", cursoId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!cursoId,
  });

  const filteredStudents = students.filter(student =>
    student.nombre_estudiante.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email_estudiante.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "activo":
        return <Badge className="bg-primary text-primary-foreground">Activo</Badge>;
      case "completado":
        return <Badge className="bg-green-500 text-white">Completado</Badge>;
      case "inactivo":
        return <Badge variant="secondary">Inactivo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeStudents = students.filter(s => s.estado === "activo").length;
  const completedStudents = students.filter(s => s.estado === "completado").length;
  const avgProgress = students.length > 0 
    ? Math.round(students.reduce((sum, s) => sum + (s.progreso || 0), 0) / students.length)
    : 0;

  const stats = [
    { title: "Total Estudiantes", value: students.length.toString(), icon: Users },
    { title: "Activos", value: activeStudents.toString(), icon: BookOpen },
    { title: "Completados", value: completedStudents.toString(), icon: Award },
    { title: "Progreso Promedio", value: `${avgProgress}%`, icon: BookOpen },
  ];

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/academy">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Academy
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {courseData?.titulo || "Estudiantes de Cursos"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona el progreso y rendimiento de los estudiantes
            </p>
          </div>
          {cursoId && <CreateStudentDialog cursoId={cursoId} />}
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

        {/* Students Table */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Estudiantes ({filteredStudents.length})</CardTitle>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar estudiantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Inscripción</TableHead>
                    <TableHead>Última Actividad</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm 
                            ? "No se encontraron estudiantes con los filtros aplicados"
                            : "No hay estudiantes registrados en este curso"
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.nombre_estudiante}</div>
                            <div className="text-sm text-muted-foreground">{student.email_estudiante}</div>
                          </div>
                        </TableCell>
                        <TableCell>{courseData?.titulo || "-"}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{student.progreso || 0}%</span>
                            </div>
                            <Progress value={student.progreso || 0} className="w-20" />
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(student.estado)}</TableCell>
                        <TableCell>
                          {new Date(student.fecha_inscripcion).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(student.ultima_actividad).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">Ver Detalle</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CourseStudents;
