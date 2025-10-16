import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateCuotaDialogProps {
  studentId: string;
}

export const CreateCuotaDialog = ({ studentId }: CreateCuotaDialogProps) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    numero_cuota: "",
    monto: "",
  });

  const createCuotaMutation = useMutation({
    mutationFn: async (data: typeof formData & { fecha_vencimiento: string }) => {
      const { data: result, error } = await supabase
        .from("cuotas_estudiantes")
        .insert({
          estudiante_curso_id: studentId,
          numero_cuota: parseInt(data.numero_cuota),
          monto: parseFloat(data.monto),
          fecha_vencimiento: data.fecha_vencimiento,
          estado: "pendiente",
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Cuota creada",
        description: "La cuota se ha registrado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["cuotas", studentId] });
      setOpen(false);
      setFormData({
        numero_cuota: "",
        monto: "",
      });
      setDate(undefined);
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
    if (!date) {
      toast({
        title: "Error",
        description: "Debes seleccionar una fecha de vencimiento",
        variant: "destructive",
      });
      return;
    }

    createCuotaMutation.mutate({
      ...formData,
      fecha_vencimiento: format(date, "yyyy-MM-dd"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cuota
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nueva Cuota</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="numero_cuota">Número de Cuota</Label>
            <Input
              id="numero_cuota"
              type="number"
              min="1"
              value={formData.numero_cuota}
              onChange={(e) => setFormData({ ...formData, numero_cuota: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="monto">Monto ($)</Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Fecha de Vencimiento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Seleccionar fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCuotaMutation.isPending}>
              {createCuotaMutation.isPending ? "Creando..." : "Crear Cuota"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
