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
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
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
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Por favor selecciona un archivo");
      return;
    }

    setUploading(true);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("imports")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("imports").getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("importaciones_queue")
        .insert({
          archivo_nombre: file.name,
          archivo_url: publicUrl,
          archivo_size: file.size,
          estado: "pendiente",
          chunk_numero: 1,
          chunk_total: 1,
          registros_inicio: 0,
          registros_fin: 0,
        });

      if (insertError) throw insertError;

      toast.success("Archivo cargado exitosamente");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["importaciones"] });
    } catch (error: any) {
      toast.error(`Error al cargar archivo: ${error.message}`);
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
            <Label htmlFor="file">Archivo Excel (.xlsx)</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Cargar Archivo
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
