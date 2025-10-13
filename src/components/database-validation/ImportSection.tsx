import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const ImportSection = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const queryClient = useQueryClient();

  const { data: importaciones, isLoading } = useQuery({
    queryKey: ["importaciones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("importaciones_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );
    
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
    } else {
      toast.error('Por favor arrastra archivos Excel (.xlsx, .xls)');
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Por favor selecciona al menos un archivo");
      return;
    }

    setUploading(true);

    try {
      for (const file of files) {
        // Sanitizar el nombre del archivo removiendo caracteres especiales
        const sanitizedName = file.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_+/g, '_');
        const fileName = `${Date.now()}-${sanitizedName}`;
        const { error: uploadError } = await supabase.storage
          .from("imports")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("imports").getPublicUrl(fileName);

        const { data: queueData, error: insertError } = await supabase
          .from("importaciones_queue")
          .insert({
            archivo_nombre: file.name,
            archivo_url: fileName, // Usar fileName en lugar de publicUrl
            archivo_size: file.size,
            estado: "pendiente",
            chunk_numero: 1,
            chunk_total: 1,
            registros_inicio: 0,
            registros_fin: 0,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Invocar la Edge Function para procesar el archivo
        const { error: functionError } = await supabase.functions.invoke(
          "process-import-chunk",
          {
            body: { queueId: queueData.id },
          }
        );

        if (functionError) {
          console.error("Error procesando archivo:", functionError);
          toast.error(`Error procesando ${file.name}: ${functionError.message}`);
        }
      }

      toast.success(`${files.length} archivo(s) procesándose exitosamente`);
      setFiles([]);
      queryClient.invalidateQueries({ queryKey: ["importaciones"] });
    } catch (error: any) {
      toast.error(`Error al cargar archivos: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      pendiente: "bg-yellow-600",
      procesando: "bg-blue-600",
      completado: "bg-green-600",
      error: "bg-red-600",
    };
    return <Badge className={colors[estado] || "bg-gray-600"}>{estado}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importación de Asistentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Archivos Excel (.xlsx)</Label>
            <p className="text-sm text-muted-foreground">
              Usa la{" "}
              <a
                href="/Plantilla_Importacion.xlsx"
                download
                className="text-primary hover:underline font-medium"
              >
                plantilla oficial
              </a>
              {" "}para importar asistentes. Las validaciones de integridad se ejecutan automáticamente.
            </p>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <Upload className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic para seleccionar'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Archivos Excel (.xlsx, .xls)
                  </p>
                </div>
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {files.length} archivo(s) seleccionado(s): {files.map(f => f.name).join(', ')}
              </div>
            )}
          </div>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Procesando {files.length} archivo(s)...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Procesar {files.length > 0 ? `${files.length} archivo(s)` : 'Archivos'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Importaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importaciones?.map((imp) => (
                  <TableRow key={imp.id}>
                    <TableCell className="font-medium">
                      {imp.archivo_nombre}
                    </TableCell>
                    <TableCell>{getEstadoBadge(imp.estado)}</TableCell>
                    <TableCell>{imp.progreso_porcentaje}%</TableCell>
                    <TableCell>
                      {imp.registros_procesados} / {imp.registros_fin}
                    </TableCell>
                    <TableCell>
                      {new Date(imp.created_at).toLocaleString("es-ES")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
