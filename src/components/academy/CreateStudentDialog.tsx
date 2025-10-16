import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateStudentDialogProps {
  cursoId: string;
}

export const CreateStudentDialog = ({ cursoId }: CreateStudentDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nombre_estudiante: "",
    email_estudiante: "",
    telefono_estudiante: "",
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from("estudiantes_cursos")
        .insert({
          ...data,
          curso_id: cursoId,
          estado: "activo",
          progreso: 0,
          monto_pagado: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Estudiante agregado",
        description: "El estudiante se ha inscrito exitosamente al curso",
      });
      queryClient.invalidateQueries({ queryKey: ["course-students", cursoId] });
      setOpen(false);
      setFormData({
        nombre_estudiante: "",
        email_estudiante: "",
        telefono_estudiante: "",
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
    createStudentMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Estudiante
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inscribir Nuevo Estudiante</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre_estudiante">Nombre Completo</Label>
            <Input
              id="nombre_estudiante"
              value={formData.nombre_estudiante}
              onChange={(e) => setFormData({ ...formData, nombre_estudiante: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email_estudiante">Email</Label>
            <Input
              id="email_estudiante"
              type="email"
              value={formData.email_estudiante}
              onChange={(e) => setFormData({ ...formData, email_estudiante: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="telefono_estudiante">Teléfono (opcional)</Label>
            <Input
              id="telefono_estudiante"
              type="tel"
              value={formData.telefono_estudiante}
              onChange={(e) => setFormData({ ...formData, telefono_estudiante: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createStudentMutation.isPending}>
              {createStudentMutation.isPending ? "Inscribiendo..." : "Inscribir"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
