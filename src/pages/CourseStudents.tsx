import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Users, BookOpen, Award, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

type Student = {
  id: string;
  name: string;
  email: string;
  course: string;
  progress: number;
  status: "active" | "completed" | "inactive";
  enrollmentDate: string;
  lastActivity: string;
};

const CourseStudents = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const mockStudents: Student[] = [
    {
      id: "1",
      name: "Carlos Mendoza",
      email: "carlos@email.com",
      course: "Producción Musical Básica",
      progress: 75,
      status: "active",
      enrollmentDate: "2025-01-10",
      lastActivity: "2025-01-18"
    },
    {
      id: "2",
      name: "Ana Rodríguez",
      email: "ana@email.com",
      course: "Marketing para Músicos",
      progress: 100,
      status: "completed",
      enrollmentDate: "2025-01-05",
      lastActivity: "2025-01-17"
    },
    {
      id: "3",
      name: "Luis García",
      email: "luis@email.com",
      course: "Producción Musical Básica",
      progress: 45,
      status: "active",
      enrollmentDate: "2025-01-12",
      lastActivity: "2025-01-16"
    }
  ];

  const filteredStudents = mockStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-primary text-primary-foreground">Activo</Badge>;
      case "completed":
        return <Badge className="bg-success text-success-foreground">Completado</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactivo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = [
    { title: "Total Estudiantes", value: mockStudents.length.toString(), icon: Users },
    { title: "Activos", value: mockStudents.filter(s => s.status === "active").length.toString(), icon: BookOpen },
    { title: "Completados", value: mockStudents.filter(s => s.status === "completed").length.toString(), icon: Award },
    { title: "Progreso Promedio", value: `${Math.round(mockStudents.reduce((sum, s) => sum + s.progress, 0) / mockStudents.length)}%`, icon: BookOpen },
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
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Estudiantes de Cursos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona el progreso y rendimiento de los estudiantes
            </p>
          </div>
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
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm 
                            ? "No se encontraron estudiantes con los filtros aplicados"
                            : "No hay estudiantes registrados"
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{student.course}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{student.progress}%</span>
                            </div>
                            <Progress value={student.progress} className="w-20" />
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(student.status)}</TableCell>
                        <TableCell>
                          {new Date(student.enrollmentDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(student.lastActivity).toLocaleDateString()}
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
