import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { useQuery, useQueryClient } from "@tanstack/react-query";

type BulkEmailDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedAttendees: any[];
};

export const BulkEmailDialog = ({ isOpen, onClose, selectedAttendees }: BulkEmailDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    plantillaId: "none",
    asunto: "",
    contenido: "",
    remitente: "Cusica <noreply@cusica.com>",
  });

  // Fetch email templates
  const { data: plantillas = [] } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plantillas_email")
        .select("*")
        .eq("activa", true)
        .order("nombre");

      if (error) throw error;
      return data || [];
    },
  });

  const handlePlantillaChange = (plantillaId: string) => {
    if (plantillaId === "none") {
      setFormData({
        ...formData,
        plantillaId: "none",
      });
      return;
    }
    
    const plantilla = plantillas.find((p: any) => p.id === plantillaId);
    if (plantilla) {
      setFormData({
        ...formData,
        plantillaId,
        asunto: plantilla.asunto_predeterminado || "",
        contenido: plantilla.contenido_html || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.asunto || !formData.contenido) {
      toast({
        title: "Error",
        description: "El asunto y el contenido son requeridos.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Crear campaña
      const { data: campana, error: campanaError } = await supabase
        .from("campanas_email")
        .insert({
          nombre: `Envío masivo - ${new Date().toLocaleDateString()}`,
          asunto: formData.asunto,
          contenido: formData.contenido,
          contenido_html: formData.contenido,
          tipo: "promocional",
          estado: "enviada",
          audiencia: "personalizado",
          filtros_audiencia: {
            asistentes_ids: selectedAttendees.map(a => a.id)
          },
          plantilla_id: formData.plantillaId !== "none" ? formData.plantillaId : null,
          fecha_enviada: new Date().toISOString(),
        })
        .select()
        .single();

      if (campanaError) throw campanaError;

      // Crear registros de envios_email para cada destinatario
      const enviosData = selectedAttendees.map((asistente) => ({
        campana_id: campana.id,
        email_destinatario: asistente.email,
        estado: 'enviado',
        fecha_envio: new Date().toISOString(),
      }));

      const { error: enviosError } = await supabase
        .from('envios_email')
        .insert(enviosData);

      if (enviosError) throw enviosError;

      // Llamar al edge function para enviar emails
      const { error: sendError } = await supabase.functions.invoke("send-campaign-emails", {
        body: {
          campaign_id: campana.id,
          evento_nombre: 'Cusica',
        },
      });

      if (sendError) {
        console.error("Error sending emails:", sendError);
        toast({
          title: "Advertencia",
          description: "La campaña se creó pero hubo un problema al enviar algunos emails. Revisa los logs.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Emails enviados",
          description: `Se enviaron ${selectedAttendees.length} emails exitosamente.`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      onClose();
      
      // Reset form
      setFormData({
        plantillaId: "none",
        asunto: "",
        contenido: "",
        remitente: "Cusica <noreply@cusica.com>",
      });
    } catch (error: any) {
      console.error("Error sending bulk emails:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron enviar los emails.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Envío Masivo de Emails</DialogTitle>
          <DialogDescription>
            Enviar email a {selectedAttendees.length} asistente(s) seleccionado(s)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Plantilla */}
            <div className="space-y-2">
              <Label htmlFor="plantilla">Plantilla (opcional)</Label>
              <Select
                value={formData.plantillaId}
                onValueChange={handlePlantillaChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plantilla..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="none">Sin plantilla</SelectItem>
                  {plantillas.map((plantilla: any) => (
                    <SelectItem key={plantilla.id} value={plantilla.id}>
                      {plantilla.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Remitente */}
            <div className="space-y-2">
              <Label htmlFor="remitente">Remitente</Label>
              <Input
                id="remitente"
                value={formData.remitente}
                onChange={(e) => setFormData({ ...formData, remitente: e.target.value })}
                placeholder="Nombre <email@dominio.com>"
                required
              />
            </div>

            {/* Asunto */}
            <div className="space-y-2">
              <Label htmlFor="asunto">Asunto</Label>
              <Input
                id="asunto"
                value={formData.asunto}
                onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                placeholder="Asunto del email..."
                required
              />
            </div>

            {/* Contenido */}
            <div className="space-y-2">
              <Label htmlFor="contenido">Contenido del Email</Label>
              <Textarea
                id="contenido"
                value={formData.contenido}
                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                placeholder="Escribe el contenido del email aquí... Puedes usar HTML."
                rows={12}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Puedes usar variables como {"{{nombre}}"}, {"{{apellido}}"}, {"{{email}}"}
              </p>
            </div>

            {/* Lista de destinatarios */}
            <div className="space-y-2">
              <Label>Destinatarios</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-3 bg-muted/50">
                <div className="space-y-1">
                  {selectedAttendees.slice(0, 10).map((asistente) => (
                    <div key={asistente.id} className="text-sm">
                      {asistente.nombre} {asistente.apellido} - {asistente.email}
                    </div>
                  ))}
                  {selectedAttendees.length > 10 && (
                    <div className="text-sm text-muted-foreground italic">
                      ... y {selectedAttendees.length - 10} más
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : `Enviar a ${selectedAttendees.length} asistente(s)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
