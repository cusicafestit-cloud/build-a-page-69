import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ValidacionBD } from "@/types/database-validation";
import { Play, PlayCircle, AlertCircle, CheckCircle, Clock, Eye } from "lucide-react";
import { ValidationDetailsModal } from "./ValidationDetailsModal";

interface ValidationChecksSectionProps {
  validations: ValidacionBD[] | undefined;
  isLoading: boolean;
  onExecute: (id: string) => void;
  onExecuteAll: () => void;
  isExecuting: boolean;
}

export const ValidationChecksSection = ({
  validations,
  isLoading,
  onExecute,
  onExecuteAll,
  isExecuting,
}: ValidationChecksSectionProps) => {
  const [selectedValidation, setSelectedValidation] = useState<ValidacionBD | null>(null);

  const getStatusBadge = (validation: ValidacionBD) => {
    if (validation.estado === "ejecutando") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3 animate-spin" />
          Ejecutando
        </Badge>
      );
    }
    if (validation.estado === "fallido") {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Fallido
        </Badge>
      );
    }
    if (validation.problemas_encontrados === 0) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Aprobado
        </Badge>
      );
    }
    if (validation.problemas_encontrados < validation.umbral_error) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-600 text-white">
          <AlertCircle className="h-3 w-3" />
          Advertencia ({validation.problemas_encontrados})
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Error ({validation.problemas_encontrados})
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const colors = {
      integridad: "bg-blue-600",
      consistencia: "bg-purple-600",
      seguridad: "bg-red-600",
    };
    return (
      <Badge className={colors[tipo as keyof typeof colors] || "bg-gray-600"}>
        {tipo}
      </Badge>
    );
  };

  if (isLoading) {
    return <div>Cargando validaciones...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Validaciones de Integridad</CardTitle>
          <Button
            onClick={onExecuteAll}
            disabled={isExecuting || !validations?.some((v) => v.activa)}
            className="flex items-center gap-2"
          >
            <PlayCircle className="h-4 w-4" />
            Ejecutar Todas
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última Ejecución</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validations?.map((validation) => (
                <TableRow key={validation.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{validation.nombre}</div>
                      <div className="text-sm text-muted-foreground">
                        {validation.descripcion}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTipoBadge(validation.tipo)}</TableCell>
                  <TableCell>{getStatusBadge(validation)}</TableCell>
                  <TableCell>
                    {validation.ultima_ejecucion
                      ? new Date(validation.ultima_ejecucion).toLocaleString("es-ES")
                      : "Nunca"}
                  </TableCell>
                  <TableCell>
                    {validation.duracion_segundos > 0
                      ? `${validation.duracion_segundos.toFixed(2)}s`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExecute(validation.id)}
                        disabled={!validation.activa || isExecuting}
                        className="flex items-center gap-1"
                      >
                        <Play className="h-3 w-3" />
                        Ejecutar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedValidation(validation)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Ver
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ValidationDetailsModal
        validation={selectedValidation}
        open={!!selectedValidation}
        onClose={() => setSelectedValidation(null)}
        onExecute={(id) => {
          onExecute(id);
          setSelectedValidation(null);
        }}
      />
    </>
  );
};
