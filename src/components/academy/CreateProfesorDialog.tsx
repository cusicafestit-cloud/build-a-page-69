import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const CreateProfesorDialog = () => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nombre: "",
    especialidades: "",
    bio: "",
    descripcion: "",
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

      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setFoto(null);
    setPreviewUrl(null);
  };

  const createProfesorMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let fotoUrl = null;

      if (foto) {
        setUploading(true);
        const fileExt = foto.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profesores-fotos')
          .upload(fileName, foto);

        if (uploadError) {
          setUploading(false);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('profesores-fotos')
          .getPublicUrl(fileName);
        
        fotoUrl = publicUrl;
        setUploading(false);
      }

      const especialidadesArray = data.especialidades
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);

      const { data: result, error } = await supabase
        .from("profesores")
        .insert({
          nombre: data.nombre,
          especialidades: especialidadesArray,
          bio: data.bio,
          descripcion: data.descripcion,
          foto_url: fotoUrl,
          activo: true,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Profesor creado",
        description: "El profesor se ha registrado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["profesores"] });
      setOpen(false);
      setFormData({
        nombre: "",
        especialidades: "",
        bio: "",
        descripcion: "",
      });
      setFoto(null);
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
    createProfesorMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Profesor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Profesor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Foto del Profesor</Label>
            {!previewUrl ? (
              <div className="mt-2">
                <label
                  htmlFor="foto"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click para subir imagen (máx. 5MB)
                  </span>
                  <input
                    id="foto"
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
                  alt="Foto del profesor"
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
            <Label htmlFor="nombre">Nombre Completo</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="especialidades">Especialidades (separadas por comas)</Label>
            <Input
              id="especialidades"
              value={formData.especialidades}
              onChange={(e) => setFormData({ ...formData, especialidades: e.target.value })}
              placeholder="Ejemplo: Piano, Teoría Musical, Composición"
            />
          </div>

          <div>
            <Label htmlFor="bio">Biografía Corta</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              placeholder="Resumen breve del profesor..."
            />
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción Completa</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={5}
              placeholder="Experiencia, logros, metodología, etc..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createProfesorMutation.isPending || uploading}>
              {uploading ? "Subiendo foto..." : createProfesorMutation.isPending ? "Creando..." : "Crear Profesor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
