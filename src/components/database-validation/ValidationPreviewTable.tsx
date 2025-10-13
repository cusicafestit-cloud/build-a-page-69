import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PreviewRecord {
  email: string;
  nombre: string;
  apellido: string;
  evento_nombre: string;
  evento_encontrado: {
    id: string;
    nombre: string;
  } | null;
  ticket_encontrado: {
    id: string;
    tipo: string;
  } | null;
  estado_validacion: "valido" | "error" | "advertencia";
  errores: string[];
  advertencias: string[];
}

interface ValidationPreviewTableProps {
  records: PreviewRecord[];
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming: boolean;
}

export const ValidationPreviewTable = ({
  records,
  onConfirm,
  onCancel,
  isConfirming,
}: ValidationPreviewTableProps) => {
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  const validRecords = records.filter(r => r.estado_validacion === "valido");
  const errorRecords = records.filter(r => r.estado_validacion === "error");
  const warningRecords = records.filter(r => r.estado_validacion === "advertencia");

  const displayedRecords = showOnlyErrors 
    ? records.filter(r => r.estado_validacion !== "valido")
    : records;

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case "valido":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "advertencia":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "valido":
        return <Badge className="bg-green-600">Válido</Badge>;
      case "error":
        return <Badge className="bg-red-600">Error</Badge>;
      case "advertencia":
        return <Badge className="bg-yellow-600">Advertencia</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Vista Previa de Importación</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOnlyErrors(!showOnlyErrors)}
            >
              {showOnlyErrors ? "Mostrar Todos" : "Solo Errores"}
            </Button>
          </div>
        </CardTitle>
        <div className="flex gap-4 text-sm mt-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>{validRecords.length} Válidos</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span>{warningRecords.length} Advertencias</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>{errorRecords.length} Errores</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Estado</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Apellido</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Ticket</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRecords.map((record, index) => (
                <TableRow key={index} className={
                  record.estado_validacion === "error" ? "bg-red-50 dark:bg-red-950/20" :
                  record.estado_validacion === "advertencia" ? "bg-yellow-50 dark:bg-yellow-950/20" :
                  ""
                }>
                  <TableCell>
                    {getStatusIcon(record.estado_validacion)}
                  </TableCell>
                  <TableCell className="font-medium">{record.email}</TableCell>
                  <TableCell>{record.nombre}</TableCell>
                  <TableCell>{record.apellido}</TableCell>
                  <TableCell>
                    {record.evento_encontrado ? (
                      <div className="space-y-1">
                        <div className="font-medium">{record.evento_encontrado.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.evento_encontrado.id.substring(0, 8)}...
                        </div>
                      </div>
                    ) : (
                      <Badge variant="destructive">No encontrado</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.ticket_encontrado ? (
                      <div className="space-y-1">
                        <div className="font-medium">{record.ticket_encontrado.tipo}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.ticket_encontrado.id.substring(0, 8)}...
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline">Por defecto</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 max-w-xs">
                      {record.errores.map((error, i) => (
                        <div key={i} className="text-xs text-red-600 dark:text-red-400">
                          • {error}
                        </div>
                      ))}
                      {record.advertencias.map((warning, i) => (
                        <div key={i} className="text-xs text-yellow-600 dark:text-yellow-400">
                          • {warning}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-6 pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            {errorRecords.length > 0 ? (
              <span className="text-red-600 font-medium">
                {errorRecords.length} registro(s) con errores no se importarán
              </span>
            ) : (
              <span className="text-green-600 font-medium">
                Todos los registros son válidos
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} disabled={isConfirming}>
              Cancelar
            </Button>
            <Button 
              onClick={onConfirm} 
              disabled={validRecords.length === 0 || isConfirming}
              className="gap-2"
            >
              {isConfirming ? (
                <>
                  <Upload className="h-4 w-4 animate-bounce" />
                  Confirmando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Confirmar e Importar {validRecords.length} registros
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
