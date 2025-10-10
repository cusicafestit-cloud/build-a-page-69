import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, BookOpen, Play, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const Academy = () => {
  const courses = [
    {
      id: "1",
      title: "Producción Musical Básica",
      description: "Aprende los fundamentos de la producción musical",
      students: 45,
      lessons: 12,
      status: "active",
      image: "/api/placeholder/300/200"
    },
    {
      id: "2",
      title: "Marketing para Músicos",
      description: "Estrategias de marketing digital para artistas",
      students: 32,
      lessons: 8,
      status: "active",
      image: "/api/placeholder/300/200"
    },
    {
      id: "3",
      title: "Teoría Musical Avanzada",
      description: "Conceptos avanzados de teoría musical",
      students: 28,
      lessons: 15,
      status: "draft",
      image: "/api/placeholder/300/200"
    }
  ];

  const stats = [
    { title: "Total Cursos", value: "12", icon: BookOpen },
    { title: "Estudiantes Activos", value: "156", icon: Users },
    { title: "Lecciones", value: "89", icon: Play },
    { title: "Tasa Completación", value: "78%", icon: GraduationCap },
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
          <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Curso
          </Button>
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
          {courses.map((course) => (
            <Card key={course.id} className="border-none shadow-lg hover:shadow-xl transition-all">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-t-lg flex items-center justify-center">
                <GraduationCap className="w-12 h-12 text-primary" />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <Badge variant={course.status === "active" ? "default" : "secondary"}>
                    {course.status === "active" ? "Activo" : "Borrador"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{course.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{course.students} estudiantes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-muted-foreground" />
                      <span>{course.lessons} lecciones</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Editar
                    </Button>
                    <Link to="/academy/students" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Ver Estudiantes
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Academy;
