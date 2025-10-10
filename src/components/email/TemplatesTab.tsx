import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Edit, Trash2, Copy, Search } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate, TEMPLATE_CATEGORIES } from "@/types/email-templates";
import { TemplateEditorDialog } from "./TemplateEditorDialog";
import { CardGridSkeleton } from "@/components/ui/skeleton-components";

export const TemplatesTab = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query de plantillas
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["email-templates", categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("plantillas_email")
        .select("*")
        .eq("activa", true)
        .order("created_at", { ascending: false });
      
      if (categoryFilter !== "all") {
        query = query.eq("categoria", categoryFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as EmailTemplate[];
    },
  });

  // Filtrar por búsqueda
  const filteredTemplates = templates.filter((template) =>
    template.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mutation para eliminar
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("plantillas_email")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla ha sido eliminada correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la plantilla.",
        variant: "destructive",
      });
    },
  });

  // Mutation para duplicar
  const duplicateTemplateMutation = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      const { data, error } = await supabase
        .from("plantillas_email")
        .insert({
          nombre: `${template.nombre} (Copia)`,
          descripcion: template.descripcion,
          asunto_predeterminado: template.asunto_predeterminado,
          contenido_html: template.contenido_html,
          contenido_texto: template.contenido_texto,
          variables_disponibles: template.variables_disponibles,
          categoria: template.categoria,
          es_predeterminada: false,
          activa: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Plantilla duplicada",
        description: "La plantilla ha sido duplicada correctamente.",
      });
    },
  });

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsEditorOpen(true);
  };

  const getCategoryBadgeColor = (categoria?: string) => {
    switch (categoria) {
      case "evento": return "bg-blue-500";
      case "promocion": return "bg-orange-500";
      case "recordatorio": return "bg-purple-500";
      case "confirmacion": return "bg-green-500";
      case "bienvenida": return "bg-pink-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con búsqueda y crear */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-4 flex-1 w-full md:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar plantillas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]" title="Filtrar por categoría">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate} className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Grid de plantillas */}
      {isLoading ? (
        <CardGridSkeleton columns={3} items={6} />
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No se encontraron plantillas</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || categoryFilter !== "all"
              ? "Intenta ajustar los filtros de búsqueda"
              : "Crea tu primera plantilla de email"}
          </p>
          {!searchQuery && categoryFilter === "all" && (
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Plantilla
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{template.nombre}</CardTitle>
                  {template.categoria && (
                    <Badge className={`${getCategoryBadgeColor(template.categoria)} text-white`}>
                      {TEMPLATE_CATEGORIES.find(c => c.value === template.categoria)?.label || template.categoria}
                    </Badge>
                  )}
                </div>
                {template.descripcion && (
                  <CardDescription className="line-clamp-2">
                    {template.descripcion}
                  </CardDescription>
                )}
                {template.asunto_predeterminado && (
                  <div className="text-sm text-muted-foreground mt-2">
                    <strong>Asunto:</strong> {template.asunto_predeterminado}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {/* Preview del HTML */}
                <div className="mb-4 border rounded-lg overflow-hidden bg-muted/20" style={{ height: "150px" }}>
                  <iframe
                    srcDoc={template.contenido_html}
                    className="w-full h-full pointer-events-none"
                    sandbox="allow-same-origin"
                    title={`Preview ${template.nombre}`}
                  />
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateTemplateMutation.mutate(template)}
                    title="Duplicar plantilla"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  {!template.es_predeterminada && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("¿Estás seguro de eliminar esta plantilla?")) {
                          deleteTemplateMutation.mutate(template.id);
                        }
                      }}
                      title="Eliminar plantilla"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <TemplateEditorDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        template={selectedTemplate}
      />
    </div>
  );
};
