import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ValidacionBD } from "@/types/database-validation";
import { Play, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ValidationDetailsModalProps {
  validation: ValidacionBD | null;
  open: boolean;
  onClose: () => void;
  onExecute: (id: string) => void;
}

export const ValidationDetailsModal = ({
  validation,
  open,
  onClose,
  onExecute,
}: ValidationDetailsModalProps) => {
  if (!validation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{validation.nombre}</span>
            <Button
              onClick={() => onExecute(validation.id)}
              disabled={!validation.activa}
              size="sm"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Ejecutar Ahora
            </Button>
          </DialogTitle>
          <DialogDescription>{validation.descripcion}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          <div className="space-y-6">
            {/* Información General */}
            <div className="space-y-2">
              <h3 className="font-semibold">Información General</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <Badge className="ml-2">{validation.tipo}</Badge>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Badge
                    className="ml-2"
                    variant={validation.activa ? "default" : "secondary"}
                  >
                    {validation.activa ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Frecuencia:
                  </span>
                  <span className="ml-2 font-medium">
                    {validation.frecuencia_horas} horas
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Umbral Error:
                  </span>
                  <span className="ml-2 font-medium">
                    {validation.umbral_error}
                  </span>
                </div>
              </div>
            </div>

            {/* Consulta SQL */}
            <div className="space-y-2">
              <h3 className="font-semibold">Consulta SQL</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{validation.consulta_sql}</code>
              </pre>
            </div>

            {/* Última Ejecución */}
            {validation.ultima_ejecucion && (
              <div className="space-y-2">
                <h3 className="font-semibold">Última Ejecución</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Fecha</div>
                      <div className="font-medium">
                        {new Date(validation.ultima_ejecucion).toLocaleString("es-ES")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Duración</div>
                      <div className="font-medium">
                        {validation.duracion_segundos.toFixed(2)}s
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-4 rounded-lg bg-muted">
                  {validation.problemas_encontrados === 0 ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">
                        No se encontraron problemas
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium">
                        {validation.problemas_encontrados} problema(s) encontrado(s)
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Detalles del Resultado */}
            {validation.detalles_resultado &&
              Object.keys(validation.detalles_resultado).length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Detalles del Resultado</h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>
                      {JSON.stringify(validation.detalles_resultado, null, 2)}
                    </code>
                  </pre>
                </div>
              )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
