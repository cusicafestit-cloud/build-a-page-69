import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ValidationHealthStatus } from "@/types/database-validation";
import { CheckCircle2, AlertTriangle, XCircle, Clock, Activity } from "lucide-react";

interface DatabaseHealthDashboardProps {
  healthStatus: ValidationHealthStatus | null;
}

export const DatabaseHealthDashboard = ({ healthStatus }: DatabaseHealthDashboardProps) => {
  if (!healthStatus) return null;

  const getHealthColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthBadge = (percentage: number) => {
    if (percentage >= 90) return "default";
    if (percentage >= 70) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Health Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Estado General de la Base de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Salud General</span>
              <Badge variant={getHealthBadge(healthStatus.healthPercentage)}>
                {healthStatus.healthPercentage.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={healthStatus.healthPercentage} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {healthStatus.healthPercentage >= 90
                ? "Excelente - Base de datos en óptimas condiciones"
                : healthStatus.healthPercentage >= 70
                ? "Aceptable - Se detectaron algunas advertencias"
                : "Crítico - Se requiere atención inmediata"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Validaciones</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {healthStatus.passed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advertencias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {healthStatus.warnings}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errores</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {healthStatus.errors}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatus.averageDuration.toFixed(2)}s
            </div>
          </CardContent>
        </Card>
      </div>

      {healthStatus.lastExecution && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">
              Última ejecución:{" "}
              <span className="font-medium text-foreground">
                {new Date(healthStatus.lastExecution).toLocaleString("es-ES")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
