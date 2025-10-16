import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface MarkCuotaPaidDialogProps {
  cuota: any;
}

export const MarkCuotaPaidDialog = ({ cuota }: MarkCuotaPaidDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    metodo_pago: "",
    referencia_pago: "",
    notas: "",
  });

  const markPaidMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from("cuotas_estudiantes")
        .update({
          estado: "pagada",
          fecha_pago: new Date().toISOString(),
          metodo_pago: data.metodo_pago,
          referencia_pago: data.referencia_pago,
          notas: data.notas,
        })
        .eq("id", cuota.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Cuota marcada como pagada",
        description: "El pago se ha registrado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["cuotas", cuota.estudiante_curso_id] });
      setOpen(false);
      setFormData({
        metodo_pago: "",
        referencia_pago: "",
        notas: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    markPaidMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-green-50 hover:bg-green-100">
          <CheckCircle className="w-4 h-4 text-green-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar Cuota como Pagada</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium">Cuota #{cuota.numero_cuota}</p>
            <p className="text-2xl font-bold">${parseFloat(cuota.monto).toFixed(2)}</p>
          </div>

          <div>
            <Label htmlFor="metodo_pago">Método de Pago</Label>
            <Select 
              value={formData.metodo_pago} 
              onValueChange={(value) => setFormData({ ...formData, metodo_pago: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                <SelectItem value="tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="referencia_pago">Referencia de Pago (opcional)</Label>
            <Input
              id="referencia_pago"
              value={formData.referencia_pago}
              onChange={(e) => setFormData({ ...formData, referencia_pago: e.target.value })}
              placeholder="Número de transacción, recibo, etc."
            />
          </div>

          <div>
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Input
              id="notas"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Observaciones adicionales"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={markPaidMutation.isPending || !formData.metodo_pago}
              className="bg-green-600 hover:bg-green-700"
            >
              {markPaidMutation.isPending ? "Registrando..." : "Confirmar Pago"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
