import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const CreateCourseDialog = () => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagen, setImagen] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion_corta: "",
    descripcion: "",
    nivel: "principiante",
    categoria: "",
    precio: "0",
    duracion_estimada_horas: "0",
    permite_cuotas: false,
    max_cuotas: "1",
    frecuencia_dias_cuotas: "30",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen no debe superar los 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive",
        });
        return;
      }

      setImagen(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setImagen(null);
    setPreviewUrl(null);
  };

  const createCourseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Get the usuarios_sistema record for the authenticated user
      const { data: usuarioSistema, error: usuarioError } = await supabase
        .from("usuarios_sistema")
        .select("id")
        .eq("email", user.email)
        .single();

      if (usuarioError || !usuarioSistema) {
        throw new Error("Usuario del sistema no encontrado");
      }

      let imagenUrl = null;

      // Subir imagen si existe
      if (imagen) {
        setUploading(true);
        const fileExt = imagen.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('cursos-imagenes')
          .upload(fileName, imagen);

        if (uploadError) {
          setUploading(false);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('cursos-imagenes')
          .getPublicUrl(fileName);
        
        imagenUrl = publicUrl;
        setUploading(false);
      }

      const { data: result, error } = await supabase
        .from("cursos")
        .insert({
          titulo: data.titulo,
          descripcion_corta: data.descripcion_corta,
          descripcion: data.descripcion,
          nivel: data.nivel,
          categoria: data.categoria,
          precio: parseFloat(data.precio),
          duracion_estimada_horas: parseInt(data.duracion_estimada_horas),
          permite_cuotas: data.permite_cuotas,
          max_cuotas: parseInt(data.max_cuotas),
          frecuencia_dias_cuotas: parseInt(data.frecuencia_dias_cuotas),
          creado_por: usuarioSistema.id,
          estado: "borrador",
          imagen_portada_url: imagenUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Curso creado",
        description: "El curso se ha creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setOpen(false);
      setFormData({
        titulo: "",
        descripcion_corta: "",
        descripcion: "",
        nivel: "principiante",
        categoria: "",
        precio: "0",
        duracion_estimada_horas: "0",
        permite_cuotas: false,
        max_cuotas: "1",
        frecuencia_dias_cuotas: "30",
      });
      setImagen(null);
      setPreviewUrl(null);
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
    createCourseMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Curso
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Curso</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Imagen de Banner</Label>
            {!previewUrl ? (
              <div className="mt-2">
                <label
                  htmlFor="imagen"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click para subir imagen (máx. 5MB)
                  </span>
                  <input
                    id="imagen"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            ) : (
              <div className="mt-2 relative">
                <img
                  src={previewUrl}
                  alt="Banner del curso"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeFile}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

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
            <Button type="submit" disabled={createCourseMutation.isPending || uploading}>
              {uploading ? "Subiendo imagen..." : createCourseMutation.isPending ? "Creando..." : "Crear Curso"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
