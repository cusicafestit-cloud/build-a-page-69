import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type EditRefundDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  refund: any;
};

export const EditRefundDialog = ({ isOpen, onClose, refund }: EditRefundDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    estado: refund.estado || "pendiente",
    monto: refund.monto || 0,
    metodo_reembolso: refund.metodo_reembolso || "",
    banco: refund.banco || "",
    codigo_banco: refund.codigo_banco || "",
    numero_cuenta: refund.numero_cuenta || "",
    fecha_transferencia: refund.fecha_transferencia || "",
    notas_admin: refund.notas_admin || "",
  });

  useEffect(() => {
    if (refund) {
      setFormData({
        estado: refund.estado || "pendiente",
        monto: refund.monto || 0,
        metodo_reembolso: refund.metodo_reembolso || "",
        banco: refund.banco || "",
        codigo_banco: refund.codigo_banco || "",
        numero_cuenta: refund.numero_cuenta || "",
        fecha_transferencia: refund.fecha_transferencia || "",
        notas_admin: refund.notas_admin || "",
      });
    }
  }, [refund]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData: any = {
        estado: formData.estado,
        monto: parseFloat(formData.monto.toString()),
        metodo_reembolso: formData.metodo_reembolso || null,
        banco: formData.banco || null,
        codigo_banco: formData.codigo_banco || null,
        numero_cuenta: formData.numero_cuenta || null,
        fecha_transferencia: formData.fecha_transferencia || null,
        notas_admin: formData.notas_admin || null,
      };

      // Si el estado cambió a procesado, actualizar fecha_procesado
      if (formData.estado === "procesado" && refund.estado !== "procesado") {
        updateData.fecha_procesado = new Date().toISOString();
      }

      const { error } = await supabase
        .from("reembolsos")
        .update(updateData)
        .eq("id", refund.id);

      if (error) throw error;

      toast({
        title: "Reembolso actualizado",
        description: "El reembolso ha sido actualizado exitosamente.",
      });

      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      onClose();
    } catch (error: any) {
      console.error("Error updating refund:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el reembolso.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Reembolso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Información del Asistente (solo lectura) */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Asistente</h3>
              <p className="text-sm">{refund.asistente?.nombre} {refund.asistente?.apellido}</p>
              <p className="text-sm text-muted-foreground">{refund.asistente?.email}</p>
            </div>

            {/* Información del Evento (solo lectura) */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Evento</h3>
              <p className="text-sm">{refund.evento?.nombre}</p>
              <p className="text-sm text-muted-foreground">{refund.tipo_ticket?.tipo}</p>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => setFormData({ ...formData, estado: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="procesado">Procesado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="monto">Monto</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) })}
                required
              />
            </div>

            {/* Método de Reembolso */}
            <div className="space-y-2">
              <Label htmlFor="metodo_reembolso">Método de Reembolso</Label>
              <Input
                id="metodo_reembolso"
                value={formData.metodo_reembolso}
                onChange={(e) => setFormData({ ...formData, metodo_reembolso: e.target.value })}
                placeholder="Ej: Transferencia bancaria"
              />
            </div>

            {/* Información Bancaria */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banco">Banco</Label>
                <Input
                  id="banco"
                  value={formData.banco}
                  onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                  placeholder="Nombre del banco"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo_banco">Código del Banco</Label>
                <Input
                  id="codigo_banco"
                  value={formData.codigo_banco}
                  onChange={(e) => setFormData({ ...formData, codigo_banco: e.target.value })}
                  placeholder="0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_cuenta">Número de Cuenta</Label>
              <Input
                id="numero_cuenta"
                value={formData.numero_cuenta}
                onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
                placeholder="Número de cuenta bancaria"
              />
            </div>

            {/* Fecha de Transferencia */}
            <div className="space-y-2">
              <Label htmlFor="fecha_transferencia">Fecha de Transferencia</Label>
              <Input
                id="fecha_transferencia"
                type="date"
                value={formData.fecha_transferencia}
                onChange={(e) => setFormData({ ...formData, fecha_transferencia: e.target.value })}
              />
            </div>

            {/* Notas del Administrador */}
            <div className="space-y-2">
              <Label htmlFor="notas_admin">Notas del Administrador</Label>
              <Textarea
                id="notas_admin"
                value={formData.notas_admin}
                onChange={(e) => setFormData({ ...formData, notas_admin: e.target.value })}
                placeholder="Notas internas sobre este reembolso..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
