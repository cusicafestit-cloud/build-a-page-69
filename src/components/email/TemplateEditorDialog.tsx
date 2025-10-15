import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { FileText, Code, Eye, Sparkles, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  EmailTemplate,
  EmailTemplateFormData,
  AVAILABLE_VARIABLES,
  TEMPLATE_CATEGORIES,
  DEFAULT_HTML_TEMPLATE,
  replaceTemplateVariables,
} from "@/types/email-templates";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
};

export const TemplateEditorDialog = ({ open, onOpenChange, template }: Props) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState<EmailTemplateFormData>({
    nombre: "",
    descripcion: "",
    asunto_predeterminado: "",
    contenido_html: DEFAULT_HTML_TEMPLATE,
    contenido_texto: "",
    variables_disponibles: [],
    categoria: "evento",
    es_predeterminada: false,
    activa: true,
  });

  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerFileName, setBannerFileName] = useState<string>("");

  // Actualizar formulario cuando cambie la plantilla
  useEffect(() => {
    if (template) {
      setFormData({
        nombre: template.nombre,
        descripcion: template.descripcion || "",
        asunto_predeterminado: template.asunto_predeterminado || "",
        contenido_html: template.contenido_html,
        contenido_texto: template.contenido_texto || "",
        variables_disponibles: template.variables_disponibles || [],
        categoria: template.categoria || "evento",
        es_predeterminada: template.es_predeterminada,
        activa: template.activa,
      });
    } else {
      // Resetear para nueva plantilla
      setFormData({
        nombre: "",
        descripcion: "",
        asunto_predeterminado: "",
        contenido_html: DEFAULT_HTML_TEMPLATE,
        contenido_texto: "",
        variables_disponibles: [],
        categoria: "evento",
        es_predeterminada: false,
        activa: true,
      });
    }
  }, [template, open]);

  // Mutation de crear
  const createMutation = useMutation({
    mutationFn: async (data: EmailTemplateFormData) => {
      if (!data.nombre || !data.contenido_html) {
        throw new Error("Nombre y contenido HTML son requeridos");
      }

      const { data: created, error } = await supabase
        .from("plantillas_email")
        .insert({
          nombre: data.nombre,
          descripcion: data.descripcion || null,
          asunto_predeterminado: data.asunto_predeterminado || null,
          contenido_html: data.contenido_html,
          contenido_texto: data.contenido_texto || null,
          variables_disponibles: data.variables_disponibles || [],
          categoria: data.categoria || null,
          es_predeterminada: data.es_predeterminada || false,
          activa: data.activa ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Plantilla creada",
        description: "La plantilla ha sido creada exitosamente.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la plantilla.",
        variant: "destructive",
      });
    },
  });

  // Mutation de actualizar
  const updateMutation = useMutation({
    mutationFn: async (data: EmailTemplateFormData) => {
      if (!template) throw new Error("No template selected");

      const { data: updated, error } = await supabase
        .from("plantillas_email")
        .update({
          nombre: data.nombre,
          descripcion: data.descripcion || null,
          asunto_predeterminado: data.asunto_predeterminado || null,
          contenido_html: data.contenido_html,
          contenido_texto: data.contenido_texto || null,
          variables_disponibles: data.variables_disponibles || [],
          categoria: data.categoria || null,
          es_predeterminada: data.es_predeterminada || false,
          activa: data.activa ?? true,
        })
        .eq("id", template.id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Plantilla actualizada",
        description: "Los cambios han sido guardados correctamente.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la plantilla.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (template) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const insertVariable = (variableKey: string) => {
    const textarea = document.getElementById("html-editor") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.contenido_html;
      const before = text.substring(0, start);
      const after = text.substring(end);
      
      setFormData({
        ...formData,
        contenido_html: before + variableKey + after,
      });

      // Mantener el foco y mover cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableKey.length, start + variableKey.length);
      }, 0);
    }
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen es muy grande. Máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setBannerFileName(file.name);

    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBanner = () => {
    setBannerImage(null);
    setBannerFileName("");
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Error",
        description: "Por favor escribe un prompt para generar el diseño",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-email-template", {
        body: {
          prompt: aiPrompt,
          currentHtml: formData.contenido_html !== DEFAULT_HTML_TEMPLATE ? formData.contenido_html : null,
          bannerImage: bannerImage,
        },
      });

      if (error) throw error;

      if (data?.html) {
        setFormData({
          ...formData,
          contenido_html: data.html,
        });
        toast({
          title: "Diseño generado",
          description: "El diseño HTML ha sido generado exitosamente. Revisa la vista previa.",
        });
      }
    } catch (error: any) {
      console.error("Error generating template:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el diseño. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {template ? "Editar Plantilla" : "Nueva Plantilla"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Panel izquierdo: Formulario y código */}
          <div className="space-y-4 overflow-y-auto pr-2">
            <div>
              <Label htmlFor="nombre">Nombre de la Plantilla *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Confirmación de Evento"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                  <SelectTrigger id="categoria">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="asunto">Asunto Predeterminado</Label>
                <Input
                  id="asunto"
                  value={formData.asunto_predeterminado}
                  onChange={(e) => setFormData({ ...formData, asunto_predeterminado: e.target.value })}
                  placeholder="¡Tu ticket para {{evento}}!"
                />
              </div>
            </div>

            {/* Sección de IA */}
            <Card className="p-4 border-2 border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <Label className="text-base font-semibold">Generar Diseño con IA</Label>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Describe el diseño que quieres y la IA generará el código HTML automáticamente
              </p>
              <div className="space-y-3">
                {/* Banner Upload */}
                <div>
                  <Label className="text-sm mb-2">Banner (Opcional)</Label>
                  {bannerImage ? (
                    <div className="relative border rounded-lg p-3 bg-background">
                      <div className="flex items-center gap-3">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{bannerFileName}</p>
                          <p className="text-xs text-muted-foreground">Banner cargado</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveBanner}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <img 
                        src={bannerImage} 
                        alt="Banner preview" 
                        className="mt-2 w-full h-auto rounded border"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="cursor-pointer"
                        id="banner-upload"
                      />
                      <Label
                        htmlFor="banner-upload"
                        className="absolute inset-0 flex items-center justify-center bg-muted/50 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                          <Upload className="w-6 h-6 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Sube un banner</span>
                        </div>
                      </Label>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    La IA usará este banner en el diseño del email (máx. 5MB)
                  </p>
                </div>

                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ej: Crea un email moderno para confirmar asistencia a un evento de música. Debe tener un header con el banner, sección principal con detalles del evento, y un botón llamativo para descargar el ticket..."
                  rows={3}
                  className="resize-none"
                />
                <Button
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="w-full"
                  size="sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generar Diseño
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Variables disponibles */}
            <div>
              <Label>Variables Disponibles</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {AVAILABLE_VARIABLES.map((variable) => (
                  <Button
                    key={variable.key}
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => insertVariable(variable.key)}
                    title={`${variable.label}: ${variable.example}`}
                  >
                    {variable.key}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Haz clic para insertar una variable en la posición del cursor
              </p>
            </div>

            {/* Editor de código */}
            <div className="w-full space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-4 h-4 text-primary" />
                <Label htmlFor="html-editor" className="text-base font-semibold">Contenido HTML *</Label>
              </div>
              <Textarea
                id="html-editor"
                value={formData.contenido_html}
                onChange={(e) => setFormData({ ...formData, contenido_html: e.target.value })}
                className="h-[300px] font-mono text-sm"
                placeholder="<html>...</html>"
              />
            </div>
          </div>

          {/* Panel derecho: Preview */}
          <div className="border rounded-lg overflow-hidden bg-muted/20 flex flex-col">
            <div className="bg-muted p-3 border-b flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="font-medium">Vista Previa</span>
              <span className="text-xs text-muted-foreground ml-auto">
                Las variables muestran valores de ejemplo
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe
                key={`preview-${template?.id || 'new'}-${formData.contenido_html.substring(0, 50)}`}
                srcDoc={replaceTemplateVariables(formData.contenido_html)}
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
                title="Preview"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.nombre || !formData.contenido_html || createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Guardando..."
              : template
              ? "Actualizar Plantilla"
              : "Crear Plantilla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
