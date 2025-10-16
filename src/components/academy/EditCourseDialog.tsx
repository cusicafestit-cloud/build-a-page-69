import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface EditCourseDialogProps {
  course: any;
}

export const EditCourseDialog = ({ course }: EditCourseDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    titulo: course.titulo || "",
    descripcion_corta: course.descripcion_corta || "",
    descripcion: course.descripcion || "",
    nivel: course.nivel || "principiante",
    categoria: course.categoria || "",
    precio: course.precio?.toString() || "0",
    duracion_estimada_horas: course.duracion_estimada_horas?.toString() || "0",
    estado: course.estado || "borrador",
    permite_cuotas: course.permite_cuotas || false,
    max_cuotas: course.max_cuotas?.toString() || "1",
    frecuencia_dias_cuotas: course.frecuencia_dias_cuotas?.toString() || "30",
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from("cursos")
        .update({
          titulo: data.titulo,
          descripcion_corta: data.descripcion_corta,
          descripcion: data.descripcion,
          nivel: data.nivel,
          categoria: data.categoria,
          precio: parseFloat(data.precio),
          duracion_estimada_horas: parseInt(data.duracion_estimada_horas),
          estado: data.estado,
          permite_cuotas: data.permite_cuotas,
          max_cuotas: parseInt(data.max_cuotas),
          frecuencia_dias_cuotas: parseInt(data.frecuencia_dias_cuotas),
        })
        .eq("id", course.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Curso actualizado",
        description: "Los cambios se han guardado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setOpen(false);
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
    updateCourseMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1">
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Curso</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título del Curso</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="descripcion_corta">Descripción Corta</Label>
            <Input
              id="descripcion_corta"
              value={formData.descripcion_corta}
              onChange={(e) => setFormData({ ...formData, descripcion_corta: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción Completa</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nivel">Nivel</Label>
              <Select value={formData.nivel} onValueChange={(value) => setFormData({ ...formData, nivel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="principiante">Principiante</SelectItem>
                  <SelectItem value="intermedio">Intermedio</SelectItem>
                  <SelectItem value="avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="categoria">Categoría</Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="precio">Precio ($)</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="duracion">Duración (horas)</Label>
              <Input
                id="duracion"
                type="number"
                value={formData.duracion_estimada_horas}
                onChange={(e) => setFormData({ ...formData, duracion_estimada_horas: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="estado">Estado del Curso</Label>
            <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configuración de Cuotas */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="permite_cuotas">Permitir Pago en Cuotas</Label>
                <p className="text-sm text-muted-foreground">
                  Los estudiantes podrán pagar el curso en cuotas
                </p>
              </div>
              <Switch
                id="permite_cuotas"
                checked={formData.permite_cuotas}
                onCheckedChange={(checked) => setFormData({ ...formData, permite_cuotas: checked })}
              />
            </div>

            {formData.permite_cuotas && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <Label htmlFor="max_cuotas">Máximo de Cuotas</Label>
                  <Input
                    id="max_cuotas"
                    type="number"
                    min="1"
                    value={formData.max_cuotas}
                    onChange={(e) => setFormData({ ...formData, max_cuotas: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="frecuencia_dias">Frecuencia (días)</Label>
                  <Input
                    id="frecuencia_dias"
                    type="number"
                    min="1"
                    value={formData.frecuencia_dias_cuotas}
                    onChange={(e) => setFormData({ ...formData, frecuencia_dias_cuotas: e.target.value })}
                    placeholder="Días entre cuotas"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateCourseMutation.isPending}>
              {updateCourseMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
