import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type ViewRefundDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  refund: any;
};

export const ViewRefundDialog = ({ isOpen, onClose, refund }: ViewRefundDialogProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendiente":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case "aprobado":
        return <Badge className="bg-green-500 text-white hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>;
      case "procesado":
        return <Badge className="bg-primary text-primary-foreground"><CheckCircle className="w-3 h-3 mr-1" />Procesado</Badge>;
      case "rechazado":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles del Reembolso</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Asistente */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Información del Asistente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Nombre</label>
                <p className="font-medium">{refund.asistente?.nombre} {refund.asistente?.apellido}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="font-medium">{refund.asistente?.email}</p>
              </div>
            </div>
          </div>

          {/* Información del Evento */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Información del Evento</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Evento</label>
                <p className="font-medium">{refund.evento?.nombre}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Tipo de Ticket</label>
                <p className="font-medium">{refund.tipo_ticket?.tipo}</p>
              </div>
            </div>
          </div>

          {/* Información del Reembolso */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Información del Reembolso</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Monto</label>
                <p className="font-medium text-xl">${refund.monto?.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Estado</label>
                <div className="mt-1">{getStatusBadge(refund.estado)}</div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Fecha de Solicitud</label>
                <p className="font-medium">{new Date(refund.fecha_solicitud).toLocaleDateString()}</p>
              </div>
              {refund.fecha_procesado && (
                <div>
                  <label className="text-sm text-muted-foreground">Fecha de Procesamiento</label>
                  <p className="font-medium">{new Date(refund.fecha_procesado).toLocaleDateString()}</p>
                </div>
              )}
              {refund.fecha_transferencia && (
                <div>
                  <label className="text-sm text-muted-foreground">Fecha de Transferencia</label>
                  <p className="font-medium">{new Date(refund.fecha_transferencia).toLocaleDateString()}</p>
                </div>
              )}
              {refund.metodo_reembolso && (
                <div>
                  <label className="text-sm text-muted-foreground">Método de Reembolso</label>
                  <p className="font-medium">{refund.metodo_reembolso}</p>
                </div>
              )}
            </div>
          </div>

          {/* Información Bancaria */}
          {refund.banco && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Información Bancaria</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Banco</label>
                  <p className="font-medium">{refund.banco}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Código del Banco</label>
                  <p className="font-medium">{refund.codigo_banco}</p>
                </div>
                {refund.numero_cuenta && (
                  <div>
                    <label className="text-sm text-muted-foreground">Número de Cuenta</label>
                    <p className="font-medium">{refund.numero_cuenta}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notas del Administrador */}
          {refund.notas_admin && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Notas del Administrador</h3>
              <p className="text-sm bg-muted p-3 rounded-md">{refund.notas_admin}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
