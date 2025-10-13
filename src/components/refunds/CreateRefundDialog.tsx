import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, ChevronDown, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  const [attendeeSearchOpen, setAttendeeSearchOpen] = useState(false);
  const [attendeeSearchTerm, setAttendeeSearchTerm] = useState("");
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null);
  const [selectedAsistenciaId, setSelectedAsistenciaId] = useState("");

  const [formData, setFormData] = useState({
    banco: "",
    codigo_banco: "",
    numero_cuenta: "",
    monto: "",
    estado: "pendiente",
  });

  // Fetch attendees
  const { data: attendees = [] } = useQuery({
    queryKey: ["attendees-for-refund"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asistentes")
        .select("id, nombre, apellido, email")
        .order("nombre");
      if (error) throw error;
      return data;
    },
  });

  // Fetch asistencias (tickets) for selected attendee
  const { data: asistencias = [] } = useQuery({
    queryKey: ["attendee-asistencias", selectedAttendee?.id],
    queryFn: async () => {
      if (!selectedAttendee?.id) return [];
      const { data, error } = await supabase
        .from("asistencias")
        .select(`
          id,
          evento_id,
          tipo_ticket_id,
          codigo_ticket,
          eventos:evento_id(nombre, fecha),
          tipos_tickets:tipo_ticket_id(tipo, precio)
        `)
        .eq("asistente_id", selectedAttendee.id)
        .eq("estado", "confirmado");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedAttendee?.id,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAttendee) {
      toast.error("Debe seleccionar un asistente");
      return;
    }

    if (!selectedAsistenciaId) {
      toast.error("Debe seleccionar un ticket específico");
      return;
    }

    setLoading(true);

    try {
      const selectedAsistencia = asistencias.find(a => a.id === selectedAsistenciaId);
      if (!selectedAsistencia) {
        throw new Error("No se encontró la asistencia seleccionada");
      }

      const { error } = await supabase.from("reembolsos").insert({
        asistente_id: selectedAttendee.id,
        evento_id: selectedAsistencia.evento_id,
        tipo_ticket_id: selectedAsistencia.tipo_ticket_id,
        banco: formData.banco,
        codigo_banco: formData.codigo_banco,
        numero_cuenta: formData.numero_cuenta,
        monto: parseFloat(formData.monto),
        fecha_transferencia: date ? format(date, "yyyy-MM-dd") : null,
        estado: formData.estado,
        fecha_solicitud: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Reembolso creado exitosamente");
      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      onSuccess?.();
    } catch (error) {
      console.error("Error creating refund:", error);
      toast.error("Error al crear el reembolso");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      banco: "",
      codigo_banco: "",
      numero_cuenta: "",
      monto: "",
      estado: "pendiente",
    });
    setDate(undefined);
    setSelectedAttendee(null);
    setSelectedAsistenciaId("");
    setAttendeeSearchTerm("");
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

  const filteredAttendees = attendees.filter(att =>
    att.nombre?.toLowerCase().includes(attendeeSearchTerm.toLowerCase()) ||
    att.apellido?.toLowerCase().includes(attendeeSearchTerm.toLowerCase()) ||
    att.email?.toLowerCase().includes(attendeeSearchTerm.toLowerCase())
  );

  const handleSelectAttendee = (attendee: any) => {
    setSelectedAttendee(attendee);
    setAttendeeSearchOpen(false);
    setAttendeeSearchTerm(`${attendee.nombre} ${attendee.apellido} (${attendee.email})`);
    setSelectedAsistenciaId(""); // Reset selected ticket
  };

  const selectedAsistencia = asistencias.find(a => a.id === selectedAsistenciaId);

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
          {/* Selector de Asistente */}
          <div className="space-y-2">
            <Label>Asistente</Label>
            <Popover open={attendeeSearchOpen} onOpenChange={setAttendeeSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={attendeeSearchOpen}
                  className="w-full justify-between"
                >
                  {selectedAttendee ? (
                    <span>{selectedAttendee.nombre} {selectedAttendee.apellido} ({selectedAttendee.email})</span>
                  ) : (
                    "Buscar asistente..."
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Buscar por nombre o email..." 
                    value={attendeeSearchTerm}
                    onValueChange={setAttendeeSearchTerm}
                  />
                  <CommandList>
                    <CommandEmpty>No se encontraron asistentes.</CommandEmpty>
                    <CommandGroup>
                      {filteredAttendees.map((attendee) => (
                        <CommandItem
                          key={attendee.id}
                          value={`${attendee.nombre} ${attendee.email}`}
                          onSelect={() => handleSelectAttendee(attendee)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAttendee?.id === attendee.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{attendee.nombre} {attendee.apellido}</span>
                            <span className="text-sm text-muted-foreground">{attendee.email}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Selector de Ticket (Asistencia) */}
          {selectedAttendee && (
            <div className="space-y-2">
              <Label>Ticket a Reembolsar</Label>
              <Select value={selectedAsistenciaId} onValueChange={setSelectedAsistenciaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el ticket" />
                </SelectTrigger>
                <SelectContent>
                  {asistencias.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Este asistente no tiene tickets confirmados
                    </div>
                  ) : (
                    asistencias.map((asistencia: any) => (
                      <SelectItem key={asistencia.id} value={asistencia.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{asistencia.eventos?.nombre}</span>
                          <span className="text-sm text-muted-foreground">
                            {asistencia.tipos_tickets?.tipo} - ${asistencia.tipos_tickets?.precio} - {asistencia.codigo_ticket}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Monto - autocompletado del precio del ticket */}
          {selectedAsistencia && (
            <div className="space-y-2">
              <Label htmlFor="monto">Monto del Reembolso</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                placeholder="Ingrese el monto"
                value={formData.monto || selectedAsistencia?.tipos_tickets?.precio || ""}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                required
              />
            </div>
          )}

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
            <Label htmlFor="cuenta">Número de cuenta</Label>
            <Input
              id="cuenta"
              placeholder="Ingrese el número de cuenta"
              value={formData.numero_cuenta}
              onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
              required
            />
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
                  {date ? format(date, "PPP") : <span>Seleccione una fecha</span>}
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
