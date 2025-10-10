import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Database, CheckCircle, XCircle, AlertTriangle, RefreshCw, Play } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type ValidationCheck = {
  id: string;
  name: string;
  description: string;
  status: "passed" | "failed" | "warning" | "running" | "pending";
  lastRun: string;
  duration: number;
  issues?: number;
};

const DatabaseValidation = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);

  const validationChecks: ValidationCheck[] = [
    {
      id: "1",
      name: "Integridad de Eventos",
      description: "Verifica que todos los eventos tengan datos completos y válidos",
      status: "passed",
      lastRun: "2025-01-18T10:30:00Z",
      duration: 2.3,
      issues: 0
    },
    {
      id: "2",
      name: "Consistencia de Tickets",
      description: "Valida la relación entre eventos y tipos de tickets",
      status: "warning",
      lastRun: "2025-01-18T10:30:00Z",
      duration: 1.8,
      issues: 3
    },
    {
      id: "3",
      name: "Duplicados de Asistentes",
      description: "Detecta registros duplicados en la base de asistentes",
      status: "failed",
      lastRun: "2025-01-18T10:30:00Z",
      duration: 4.1,
      issues: 12
    },
    {
      id: "4",
      name: "Validación de Emails",
      description: "Verifica formato y validez de direcciones de email",
      status: "passed",
      lastRun: "2025-01-18T10:30:00Z",
      duration: 3.2,
      issues: 0
    },
    {
      id: "5",
      name: "Coherencia de Canjes",
      description: "Valida la lógica de intercambios de tickets",
      status: "warning",
      lastRun: "2025-01-18T10:30:00Z",
      duration: 1.5,
      issues: 2
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Pasó</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Falló</Badge>;
      case "warning":
        return <Badge className="bg-warning text-warning-foreground"><AlertTriangle className="w-3 h-3 mr-1" />Advertencia</Badge>;
      case "running":
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Ejecutando</Badge>;
      case "pending":
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRunAllChecks = async () => {
    setIsRunning(true);
    toast({
      title: "Validación iniciada",
      description: "Ejecutando todas las validaciones de base de datos...",
    });

    // Simulate validation process
    setTimeout(() => {
      setIsRunning(false);
      toast({
        title: "Validación completada",
        description: "Todas las validaciones han sido ejecutadas.",
      });
    }, 3000);
  };

  const handleRunSingleCheck = (checkName: string) => {
    toast({
      title: "Validación ejecutada",
      description: `Ejecutando validación: ${checkName}`,
    });
  };

  const stats = [
    { 
      title: "Total Validaciones", 
      value: validationChecks.length.toString(), 
      icon: Database 
    },
    { 
      title: "Pasaron", 
      value: validationChecks.filter(c => c.status === "passed").length.toString(), 
      icon: CheckCircle 
    },
    { 
      title: "Fallaron", 
      value: validationChecks.filter(c => c.status === "failed").length.toString(), 
      icon: XCircle 
    },
    { 
      title: "Total Issues", 
      value: validationChecks.reduce((sum, c) => sum + (c.issues || 0), 0).toString(), 
      icon: AlertTriangle 
    },
  ];

  const overallHealth = validationChecks.filter(c => c.status === "passed").length / validationChecks.length * 100;

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Validación de Base de Datos
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitorea la integridad y consistencia de los datos
            </p>
          </div>
          <Button 
            onClick={handleRunAllChecks}
            disabled={isRunning}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isRunning ? "Ejecutando..." : "Ejecutar Todas"}
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

        {/* Overall Health */}
        <Card className="border-none shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Estado General de la Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Salud General</span>
                <span className="text-2xl font-bold">{Math.round(overallHealth)}%</span>
              </div>
              <Progress value={overallHealth} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {overallHealth >= 80 ? "Base de datos en buen estado" : 
                 overallHealth >= 60 ? "Base de datos requiere atención" : 
                 "Base de datos requiere atención inmediata"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Validation Checks Table */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Validaciones de Integridad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Validación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Última Ejecución</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationChecks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{check.name}</div>
                          <div className="text-sm text-muted-foreground">{check.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(check.status)}</TableCell>
                      <TableCell>
                        {check.issues !== undefined && (
                          <span className={`font-medium ${check.issues > 0 ? 'text-destructive' : 'text-success'}`}>
                            {check.issues}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(check.lastRun).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {check.duration}s
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRunSingleCheck(check.name)}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Ejecutar
                          </Button>
                          {check.issues && check.issues > 0 && (
                            <Button size="sm" variant="outline">
                              Ver Detalles
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DatabaseValidation;
