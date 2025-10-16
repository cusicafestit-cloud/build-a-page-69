import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, DollarSign, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateCuotaDialog } from "@/components/academy/CreateCuotaDialog";
import { EditCuotaDialog } from "@/components/academy/EditCuotaDialog";
import { MarkCuotaPaidDialog } from "@/components/academy/MarkCuotaPaidDialog";

const StudentDetail = () => {
  const { studentId } = useParams();

  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estudiantes_cursos")
        .select(`
          *,
          cursos (
            titulo,
            precio
          )
        `)
        .eq("id", studentId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  const { data: cuotas = [], isLoading: loadingCuotas } = useQuery({
    queryKey: ["cuotas", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cuotas_estudiantes")
        .select("*")
        .eq("estudiante_curso_id", studentId)
        .order("numero_cuota", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  if (loadingStudent) {
    return (
      <Layout>
        <div className="p-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!student) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Estudiante no encontrado</p>
        </div>
      </Layout>
    );
  }

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "pagada":
        return <Badge className="bg-green-500 text-white">Pagada</Badge>;
      case "pendiente":
        return <Badge className="bg-yellow-500 text-white">Pendiente</Badge>;
      case "vencida":
        return <Badge className="bg-red-500 text-white">Vencida</Badge>;
      case "cancelada":
        return <Badge variant="secondary">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const totalMonto = cuotas.reduce((sum, c) => sum + parseFloat(c.monto.toString()), 0);
  const totalPagado = cuotas
    .filter(c => c.estado === "pagada")
    .reduce((sum, c) => sum + parseFloat(c.monto.toString()), 0);
  const cuotasPendientes = cuotas.filter(c => c.estado === "pendiente").length;
  const cuotasPagadas = cuotas.filter(c => c.estado === "pagada").length;

  const stats = [
    { title: "Total Cuotas", value: cuotas.length.toString(), icon: DollarSign },
    { title: "Pagadas", value: cuotasPagadas.toString(), icon: CheckCircle },
    { title: "Pendientes", value: cuotasPendientes.toString(), icon: Clock },
    { title: "Total Pagado", value: `$${totalPagado.toFixed(2)}`, icon: DollarSign },
  ];

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={`/academy/students?curso=${student.curso_id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {student.nombre_estudiante}
              </h1>
              <p className="text-muted-foreground mt-1">
                {student.email_estudiante} • {student.cursos?.titulo}
              </p>
            </div>
          </div>
          {studentId && <CreateCuotaDialog studentId={studentId} />}
        </div>

        {/* Student Info Card */}
        <Card className="border-none shadow-lg mb-8">
          <CardHeader>
            <CardTitle>Información del Estudiante</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge className="mt-1">{student.estado}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progreso</p>
                <p className="text-lg font-semibold mt-1">{student.progreso}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha Inscripción</p>
                <p className="text-lg font-semibold mt-1">
                  {new Date(student.fecha_inscripcion).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Cuotas Table */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Sistema de Cuotas</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCuotas ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : cuotas.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No hay cuotas registradas para este estudiante
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cuota #</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Fecha Vencimiento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Pago</TableHead>
                      <TableHead>Método Pago</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuotas.map((cuota) => (
                      <TableRow key={cuota.id}>
                        <TableCell className="font-medium">
                          Cuota {cuota.numero_cuota}
                        </TableCell>
                        <TableCell>${parseFloat(cuota.monto.toString()).toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(cuota.fecha_vencimiento).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(cuota.estado)}</TableCell>
                        <TableCell>
                          {cuota.fecha_pago
                            ? new Date(cuota.fecha_pago).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>{cuota.metodo_pago || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <EditCuotaDialog cuota={cuota} />
                            {cuota.estado !== "pagada" && (
                              <MarkCuotaPaidDialog cuota={cuota} />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default StudentDetail;
