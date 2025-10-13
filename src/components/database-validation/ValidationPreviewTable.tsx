import { useState, useEffect } from "react";
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
import { CheckCircle, XCircle, AlertCircle, Upload, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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
  onConfirm: (correctedRecords: PreviewRecord[]) => void;
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
  const [editedRecords, setEditedRecords] = useState<PreviewRecord[]>(records);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Cargar eventos y tickets disponibles
  const { data: eventos } = useQuery({
    queryKey: ["eventos-mapeo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos")
        .select("id, nombre")
        .order("nombre");
      if (error) throw error;
      return data;
    },
  });

  const { data: tickets } = useQuery({
    queryKey: ["tickets-mapeo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_tickets")
        .select("id, tipo, evento_id")
        .order("tipo");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    setEditedRecords(records);
  }, [records]);

  const handleEventoChange = (index: number, eventoId: string) => {
    const evento = eventos?.find(e => e.id === eventoId);
    if (!evento) return;

    const updated = [...editedRecords];
    updated[index] = {
      ...updated[index],
      evento_encontrado: {
        id: evento.id,
        nombre: evento.nombre,
      },
      errores: updated[index].errores.filter(e => !e.includes("evento")),
      estado_validacion: updated[index].errores.filter(e => !e.includes("evento")).length > 0 ? "error" :
                         updated[index].advertencias.length > 0 ? "advertencia" : "valido",
    };
    setEditedRecords(updated);
  };

  const handleTicketChange = (index: number, ticketId: string) => {
    const ticket = tickets?.find(t => t.id === ticketId);
    if (!ticket) return;

    const updated = [...editedRecords];
    updated[index] = {
      ...updated[index],
      ticket_encontrado: {
        id: ticket.id,
        tipo: ticket.tipo,
      },
      advertencias: updated[index].advertencias.filter(a => !a.includes("ticket")),
      estado_validacion: updated[index].errores.length > 0 ? "error" :
                         updated[index].advertencias.filter(a => !a.includes("ticket")).length > 0 ? "advertencia" : "valido",
    };
    setEditedRecords(updated);
  };

  const validRecords = editedRecords.filter(r => r.estado_validacion === "valido");
  const errorRecords = editedRecords.filter(r => r.estado_validacion === "error");
  const warningRecords = editedRecords.filter(r => r.estado_validacion === "advertencia");

  const displayedRecords = showOnlyErrors 
    ? editedRecords.filter(r => r.estado_validacion !== "valido")
    : editedRecords;

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
                    {editingIndex === index || !record.evento_encontrado ? (
                      <Select
                        value={record.evento_encontrado?.id || ""}
                        onValueChange={(value) => handleEventoChange(index, value)}
                      >
                        <SelectTrigger className="w-[200px] bg-background">
                          <SelectValue placeholder="Seleccionar evento" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {eventos?.map((evento) => (
                            <SelectItem key={evento.id} value={evento.id}>
                              {evento.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="font-medium">{record.evento_encontrado.nombre}</div>
                          <div className="text-xs text-muted-foreground">
                            {record.evento_encontrado.id.substring(0, 8)}...
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingIndex(index)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingIndex === index || (!record.ticket_encontrado && record.evento_encontrado) ? (
                      <Select
                        value={record.ticket_encontrado?.id || ""}
                        onValueChange={(value) => handleTicketChange(index, value)}
                        disabled={!record.evento_encontrado}
                      >
                        <SelectTrigger className="w-[200px] bg-background">
                          <SelectValue placeholder="Seleccionar ticket" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {tickets
                            ?.filter(t => t.evento_id === record.evento_encontrado?.id)
                            .map((ticket) => (
                              <SelectItem key={ticket.id} value={ticket.id}>
                                {ticket.tipo}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : record.ticket_encontrado ? (
                      <div className="flex items-center gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="font-medium">{record.ticket_encontrado.tipo}</div>
                          <div className="text-xs text-muted-foreground">
                            {record.ticket_encontrado.id.substring(0, 8)}...
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingIndex(index)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
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
              onClick={() => onConfirm(editedRecords)} 
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
