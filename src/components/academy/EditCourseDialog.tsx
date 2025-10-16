import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface EditCourseDialogProps {
  course: any;
}

export const EditCourseDialog = ({ course }: EditCourseDialogProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagen, setImagen] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(course.imagen_portada_url);
  const [imagenPromo1, setImagenPromo1] = useState<File | null>(null);
  const [previewPromo1, setPreviewPromo1] = useState<string | null>(course.imagen_promo_1);
  const [imagenPromo2, setImagenPromo2] = useState<File | null>(null);
  const [previewPromo2, setPreviewPromo2] = useState<string | null>(course.imagen_promo_2);
  const [imagenPromo3, setImagenPromo3] = useState<File | null>(null);
  const [previewPromo3, setPreviewPromo3] = useState<string | null>(course.imagen_promo_3);
  const [selectedProfesores, setSelectedProfesores] = useState<string[]>([]);
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
    lo_que_aprenderas: course.lo_que_aprenderas || "",
    modulos: course.modulos || "",
  });

  // Fetch professors
  const { data: profesores = [] } = useQuery({
    queryKey: ["profesores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profesores")
        .select("*")
        .eq("activo", true)
        .order("nombre");
      if (error) throw error;
      return data;
    },
  });

  // Fetch current course professors
  useEffect(() => {
    const fetchCourseProfesores = async () => {
      const { data, error } = await supabase
        .from("curso_profesores")
        .select("profesor_id")
        .eq("curso_id", course.id);
      
      if (!error && data) {
        setSelectedProfesores(data.map(cp => cp.profesor_id));
      }
    };

    if (open) {
      fetchCourseProfesores();
    }
  }, [course.id, open]);

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

  const handlePromoFileChange = (e: React.ChangeEvent<HTMLInputElement>, promoNumber: 1 | 2 | 3) => {
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

      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        if (promoNumber === 1) {
          setImagenPromo1(file);
          setPreviewPromo1(preview);
        } else if (promoNumber === 2) {
          setImagenPromo2(file);
          setPreviewPromo2(preview);
        } else {
          setImagenPromo3(file);
          setPreviewPromo3(preview);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePromoFile = (promoNumber: 1 | 2 | 3) => {
    if (promoNumber === 1) {
      setImagenPromo1(null);
      setPreviewPromo1(null);
    } else if (promoNumber === 2) {
      setImagenPromo2(null);
      setPreviewPromo2(null);
    } else {
      setImagenPromo3(null);
      setPreviewPromo3(null);
    }
  };

  const updateCourseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let imagenUrl = previewUrl;
      let imagenPromo1Url = previewPromo1;
      let imagenPromo2Url = previewPromo2;
      let imagenPromo3Url = previewPromo3;

      setUploading(true);

      // Subir nueva imagen principal si existe
      if (imagen) {
        const fileExt = imagen.name.split('.').pop();
        const fileName = `${course.id}_${Date.now()}.${fileExt}`;
        
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
      }

      // Subir imágenes promocionales
      if (imagenPromo1) {
        const fileExt = imagenPromo1.name.split('.').pop();
        const fileName = `promo1_${course.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('cursos-imagenes')
          .upload(fileName, imagenPromo1);

        if (uploadError) {
          setUploading(false);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('cursos-imagenes')
          .getPublicUrl(fileName);
        
        imagenPromo1Url = publicUrl;
      }

      if (imagenPromo2) {
        const fileExt = imagenPromo2.name.split('.').pop();
        const fileName = `promo2_${course.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('cursos-imagenes')
          .upload(fileName, imagenPromo2);

        if (uploadError) {
          setUploading(false);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('cursos-imagenes')
          .getPublicUrl(fileName);
        
        imagenPromo2Url = publicUrl;
      }

      if (imagenPromo3) {
        const fileExt = imagenPromo3.name.split('.').pop();
        const fileName = `promo3_${course.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('cursos-imagenes')
          .upload(fileName, imagenPromo3);

        if (uploadError) {
          setUploading(false);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('cursos-imagenes')
          .getPublicUrl(fileName);
        
        imagenPromo3Url = publicUrl;
      }

      setUploading(false);

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
          lo_que_aprenderas: data.lo_que_aprenderas,
          modulos: data.modulos,
          imagen_portada_url: imagenUrl,
          imagen_promo_1: imagenPromo1Url,
          imagen_promo_2: imagenPromo2Url,
          imagen_promo_3: imagenPromo3Url,
        })
        .eq("id", course.id)
        .select()
        .single();

      if (error) throw error;

      // Update professor relationships
      // First, delete existing relationships
      await supabase
        .from("curso_profesores")
        .delete()
        .eq("curso_id", course.id);

      // Then insert new relationships
      if (selectedProfesores.length > 0) {
        const profesorRelations = selectedProfesores.map(profesorId => ({
          curso_id: course.id,
          profesor_id: profesorId,
        }));

        const { error: relError } = await supabase
          .from("curso_profesores")
          .insert(profesorRelations);

        if (relError) throw relError;
      }

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
            <Label>Imagen de Banner</Label>
            {!previewUrl ? (
              <div className="mt-2">
                <label
                  htmlFor="imagen-edit"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click para subir imagen (máx. 5MB)
                  </span>
                  <input
                    id="imagen-edit"
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

          <div>
            <Label htmlFor="lo_que_aprenderas">Lo que Aprenderás</Label>
            <div className="mt-2">
              <ReactQuill
                theme="snow"
                value={formData.lo_que_aprenderas}
                onChange={(value) => setFormData({ ...formData, lo_que_aprenderas: value })}
                placeholder="Describe lo que los estudiantes aprenderán en este curso..."
                className="bg-background"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="modulos">Módulos del Curso</Label>
            <div className="mt-2">
              <ReactQuill
                theme="snow"
                value={formData.modulos}
                onChange={(value) => setFormData({ ...formData, modulos: value })}
                placeholder="Describe los módulos y el contenido del curso..."
                className="bg-background"
              />
            </div>
          </div>

          <div>
            <Label>Profesores</Label>
            <div className="mt-2 space-y-2 p-4 border rounded-lg max-h-48 overflow-y-auto">
              {profesores.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay profesores disponibles</p>
              ) : (
                profesores.map((profesor: any) => (
                  <div key={profesor.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`profesor-edit-${profesor.id}`}
                      checked={selectedProfesores.includes(profesor.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProfesores([...selectedProfesores, profesor.id]);
                        } else {
                          setSelectedProfesores(selectedProfesores.filter(id => id !== profesor.id));
                        }
                      }}
                    />
                    <label
                      htmlFor={`profesor-edit-${profesor.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {profesor.nombre}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Imágenes Promocionales */}
          <div className="space-y-4">
            <Label>Imágenes Promocionales del Curso</Label>
            <p className="text-sm text-muted-foreground">Sube hasta 3 imágenes promocionales (máx. 5MB cada una)</p>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Imagen Promo 1 */}
              <div>
                <Label className="text-xs">Imagen 1</Label>
                {!previewPromo1 ? (
                  <label
                    htmlFor="imagen-promo-edit-1"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors mt-2"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground text-center px-2">
                      Subir imagen
                    </span>
                    <input
                      id="imagen-promo-edit-1"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePromoFileChange(e, 1)}
                    />
                  </label>
                ) : (
                  <div className="relative mt-2">
                    <img
                      src={previewPromo1}
                      alt="Promo 1"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1"
                      onClick={() => removePromoFile(1)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Imagen Promo 2 */}
              <div>
                <Label className="text-xs">Imagen 2</Label>
                {!previewPromo2 ? (
                  <label
                    htmlFor="imagen-promo-edit-2"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors mt-2"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground text-center px-2">
                      Subir imagen
                    </span>
                    <input
                      id="imagen-promo-edit-2"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePromoFileChange(e, 2)}
                    />
                  </label>
                ) : (
                  <div className="relative mt-2">
                    <img
                      src={previewPromo2}
                      alt="Promo 2"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1"
                      onClick={() => removePromoFile(2)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Imagen Promo 3 */}
              <div>
                <Label className="text-xs">Imagen 3</Label>
                {!previewPromo3 ? (
                  <label
                    htmlFor="imagen-promo-edit-3"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors mt-2"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground text-center px-2">
                      Subir imagen
                    </span>
                    <input
                      id="imagen-promo-edit-3"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePromoFileChange(e, 3)}
                    />
                  </label>
                ) : (
                  <div className="relative mt-2">
                    <img
                      src={previewPromo3}
                      alt="Promo 3"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1"
                      onClick={() => removePromoFile(3)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
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
            <Button type="submit" disabled={updateCourseMutation.isPending || uploading}>
              {uploading ? "Subiendo imagen..." : updateCourseMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
