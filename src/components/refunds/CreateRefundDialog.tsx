import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const BANCOS_VENEZUELA = [
  { codigo: "0102", nombre: "Banco de Venezuela" },
  { codigo: "0104", nombre: "Banco Venezolano de Crédito" },
  { codigo: "0105", nombre: "Banco Mercantil" },
  { codigo: "0108", nombre: "Banco Provincial" },
  { codigo: "0114", nombre: "Banco del Caribe" },
  { codigo: "0115", nombre: "Banco Exterior" },
  { codigo: "0128", nombre: "Banco Caroní" },
  { codigo: "0134", nombre: "Banesco" },
  { codigo: "0137", nombre: "Banco Sofitasa" },
  { codigo: "0138", nombre: "Banco Plaza" },
  { codigo: "0146", nombre: "Banco de la Gente Emprendedora (Bangente)" },
  { codigo: "0151", nombre: "Banco Fondo Común (BFC)" },
  { codigo: "0156", nombre: "100% Banco" },
  { codigo: "0157", nombre: "DelSur Banco Universal" },
  { codigo: "0163", nombre: "Banco del Tesoro" },
  { codigo: "0166", nombre: "Banco Agrícola de Venezuela" },
  { codigo: "0168", nombre: "Bancrecer" },
  { codigo: "0169", nombre: "Mi Banco" },
  { codigo: "0171", nombre: "Banco Activo" },
  { codigo: "0172", nombre: "Bancamiga" },
  { codigo: "0174", nombre: "Banplus" },
  { codigo: "0175", nombre: "Banco Bicentenario" },
  { codigo: "0177", nombre: "Banco de la Fuerza Armada Nacional Bolivariana (BANFANB)" },
  { codigo: "0191", nombre: "Banco Nacional de Crédito (BNC)" },
];

interface CreateRefundDialogProps {
  onSuccess?: () => void;
}

export function CreateRefundDialog({ onSuccess }: CreateRefundDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [searchEmail, setSearchEmail] = useState("");
  const [searchEvent, setSearchEvent] = useState("");
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    email: "",
    banco: "",
    codigo_banco: "",
    fecha_transferencia: "",
    numero_cuenta: "",
    monto: "",
    evento_id: "",
    asistente_id: "",
    tipo_ticket_id: "",
    estado: "pendiente",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("reembolsos").insert({
        ...formData,
        fecha_transferencia: date ? format(date, "yyyy-MM-dd") : null,
        monto: parseFloat(formData.monto),
      });

      if (error) throw error;

      toast.success("Reembolso creado exitosamente");
      setOpen(false);
      setFormData({
        email: "",
        banco: "",
        codigo_banco: "",
        fecha_transferencia: "",
        numero_cuenta: "",
        monto: "",
        evento_id: "",
        asistente_id: "",
        tipo_ticket_id: "",
        estado: "pendiente",
      });
      setDate(undefined);
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      onSuccess?.();
    } catch (error) {
      console.error("Error creating refund:", error);
      toast.error("Error al crear el reembolso");
    } finally {
      setLoading(false);
    }
  };

  const handleBankChange = (value: string) => {
    const banco = BANCOS_VENEZUELA.find((b) => `${b.codigo} - ${b.nombre}` === value);
    if (banco) {
      setFormData({
        ...formData,
        banco: banco.nombre,
        codigo_banco: banco.codigo,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Crear Reembolso
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Reembolso</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email del Cliente</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="banco">Banco</Label>
            <Select onValueChange={handleBankChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el banco" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {BANCOS_VENEZUELA.map((banco) => (
                  <SelectItem key={banco.codigo} value={`${banco.codigo} - ${banco.nombre}`}>
                    {banco.codigo} - {banco.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha de transferencia</Label>
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
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
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

          <div className="space-y-2">
            <Label htmlFor="cuenta">Número de cuenta</Label>
            <Input
              id="cuenta"
              placeholder="Ingrese el numero de cuenta"
              value={formData.numero_cuenta}
              onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monto">Monto</Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              placeholder="Ingrese el numero de cuenta"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evento">Evento</Label>
            <Input
              id="evento"
              placeholder="Seleccione el evento"
              value={searchEvent}
              onChange={(e) => setSearchEvent(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado}
              onValueChange={(value) => setFormData({ ...formData, estado: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="procesado">Procesado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Reembolso"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
