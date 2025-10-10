import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Database, CheckCircle, XCircle, AlertTriangle, RefreshCw, Download, Upload, FileSpreadsheet, X, Clock, Users, FileCheck, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from 'xlsx';

type ImportJob = {
  id: string;
  archivo_nombre: string;
  chunk_numero: number;
  chunk_total: number;
  estado: 'pendiente' | 'procesando' | 'completado' | 'fallido';
  progreso_porcentaje: number;
  registros_procesados: number;
  registros_nuevos: number;
  registros_actualizados: number;
  registros_con_errores: number;
  genero_musical_detectado: string | null;
  duracion_segundos: number | null;
  batch_id: string;
  created_at: string;
};

type BatchSummary = {
  batch_id: string;
  archivo_nombre: string;
  total_chunks: number;
  chunks_completados: number;
  chunks_fallidos: number;
  total_nuevos: number;
  total_actualizados: number;
  total_errores: number;
  progreso: number;
  estado: 'en_progreso' | 'completado' | 'fallido';
  genero_musical: string | null;
};

const CHUNK_SIZE = 1000; // Registros por chunk
const MAX_FILE_SIZE_MB = 50; // Tamaño máximo del archivo

const DatabaseValidation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query para obtener importaciones recientes
  const { data: recentImports = [] } = useQuery({
    queryKey: ['import-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('importaciones_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as ImportJob[];
    },
    refetchInterval: 3000, // Actualizar cada 3 segundos
  });

  // Agrupar importaciones por batch_id
  const batchSummaries: BatchSummary[] = Object.values(
    recentImports.reduce((acc, job) => {
      if (!acc[job.batch_id]) {
        acc[job.batch_id] = {
          batch_id: job.batch_id,
          archivo_nombre: job.archivo_nombre,
          total_chunks: job.chunk_total,
          chunks_completados: 0,
          chunks_fallidos: 0,
          total_nuevos: 0,
          total_actualizados: 0,
          total_errores: 0,
          progreso: 0,
          estado: 'en_progreso',
          genero_musical: job.genero_musical_detectado,
        };
      }

      const batch = acc[job.batch_id];
      
      if (job.estado === 'completado') {
        batch.chunks_completados++;
        batch.total_nuevos += job.registros_nuevos;
        batch.total_actualizados += job.registros_actualizados;
        batch.total_errores += job.registros_con_errores;
      } else if (job.estado === 'fallido') {
        batch.chunks_fallidos++;
      }

      batch.progreso = ((batch.chunks_completados + batch.chunks_fallidos) / batch.total_chunks) * 100;
      
      if (batch.chunks_completados + batch.chunks_fallidos === batch.total_chunks) {
        batch.estado = batch.chunks_fallidos > 0 ? 'fallido' : 'completado';
      }

      return acc;
    }, {} as Record<string, BatchSummary>)
  );

  // Procesar siguiente chunk
  const processNextChunkMutation = useMutation({
    mutationFn: async (queueId: string) => {
      // Asegurarse de que la sesión está establecida
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa. Por favor inicia sesión.');
      }

      console.log('📡 Invocando Edge Function para queue ID:', queueId);
      
      const { data, error } = await supabase.functions.invoke('process-import-chunk', {
        body: { queueId }
      });

      if (error) {
        console.error('❌ Error en Edge Function:', error);
        throw error;
      }
      
      console.log('✅ Respuesta de Edge Function:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-batches'] });
    },
    onError: (error: any) => {
      console.error('💥 Error en mutation:', error);
      toast({
        title: "Error procesando chunk",
        description: error.message || "No se pudo procesar el chunk",
        variant: "destructive",
      });
    }
  });

  // Procesar todos los chunks pendientes de un batch
  useEffect(() => {
    if (!currentBatchId) return;
    if (processNextChunkMutation.isPending) return; // Evitar llamadas múltiples

    const pendingJobs = recentImports.filter(
      job => job.batch_id === currentBatchId && job.estado === 'pendiente'
    );

    console.log('📊 Pending jobs for batch:', currentBatchId, '→', pendingJobs.length);

    if (pendingJobs.length === 0) {
      const completedJobs = recentImports.filter(
        job => job.batch_id === currentBatchId && job.estado === 'completado'
      );
      
      if (completedJobs.length > 0) {
        const totalNuevos = completedJobs.reduce((sum, job) => sum + job.registros_nuevos, 0);
        const totalActualizados = completedJobs.reduce((sum, job) => sum + job.registros_actualizados, 0);
        
        toast({
          title: "✅ Importación completada",
          description: `${totalNuevos} nuevos, ${totalActualizados} actualizados`,
        });
      }
      
      setCurrentBatchId(null);
      setIsProcessing(false);
      return;
    }

    // Procesar el primer pendiente
    const nextJob = pendingJobs[0];
    console.log('🔄 Procesando chunk:', nextJob.chunk_numero, '/', nextJob.chunk_total, 'ID:', nextJob.id);
    processNextChunkMutation.mutate(nextJob.id);
  }, [recentImports, currentBatchId]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files);
    }
  };

  const handleFileSelection = (files: FileList | File[]) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    fileArray.forEach(file => {
      const isValidType = validTypes.includes(file.type) || 
                          file.name.endsWith('.xlsx') || 
                          file.name.endsWith('.xls') || 
                          file.name.endsWith('.csv');

      const fileSizeMB = file.size / (1024 * 1024);

      if (!isValidType) {
        invalidFiles.push(`${file.name} (tipo inválido)`);
      } else if (fileSizeMB > MAX_FILE_SIZE_MB) {
        invalidFiles.push(`${file.name} (${fileSizeMB.toFixed(2)}MB - muy grande)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "Archivos rechazados",
        description: `${invalidFiles.length} archivo(s) no válido(s): ${invalidFiles.join(', ')}`,
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "Archivos cargados",
        description: `${validFiles.length} archivo(s) listo(s) para procesar`,
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files);
    }
  };

  const handleProcessAllFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    
    toast({
      title: "Procesando archivos",
      description: `Iniciando procesamiento de ${uploadedFiles.length} archivo(s)...`,
    });

    // Procesar archivos uno por uno
    for (let fileIndex = 0; fileIndex < uploadedFiles.length; fileIndex++) {
      const uploadedFile = uploadedFiles[fileIndex];
      
      try {
        await processFile(uploadedFile, fileIndex + 1, uploadedFiles.length);
      } catch (error: any) {
        toast({
          title: `Error en ${uploadedFile.name}`,
          description: error.message,
          variant: "destructive",
        });
      }
    }

    setUploadedFiles([]);
    setIsProcessing(false);
    
    toast({
      title: "✅ Todos los archivos procesados",
      description: `${uploadedFiles.length} archivo(s) importado(s) exitosamente`,
    });
  };

  const processFile = async (uploadedFile: File, fileNum: number, totalFiles: number) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet);
          
          const totalRegistros = rows.length;
          const totalChunks = Math.ceil(totalRegistros / CHUNK_SIZE);

          toast({
            title: `Procesando archivo ${fileNum}/${totalFiles}`,
            description: `${uploadedFile.name}: ${totalRegistros} registros encontrados. Dividiendo en ${totalChunks} chunks...`,
          });

          // 2. Subir archivo a Storage
          const fileName = `${Date.now()}-${uploadedFile.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('imports')
            .upload(fileName, uploadedFile);

          if (uploadError) {
            throw new Error(`Error subiendo archivo: ${uploadError.message}`);
          }

          // 3. Crear trabajos en cola
          const batchId = crypto.randomUUID();
          const jobs = [];

          for (let i = 0; i < totalChunks; i++) {
            const registrosInicio = i * CHUNK_SIZE;
            const registrosFin = Math.min((i + 1) * CHUNK_SIZE, totalRegistros) - 1;

            jobs.push({
              archivo_nombre: uploadedFile.name,
              archivo_url: uploadData.path,
              archivo_size: uploadedFile.size,
              chunk_numero: i + 1,
              chunk_total: totalChunks,
              registros_inicio: registrosInicio,
              registros_fin: registrosFin,
              batch_id: batchId,
              estado: 'pendiente',
            });
          }

          const { error: insertError } = await supabase
            .from('importaciones_queue')
            .insert(jobs);

          if (insertError) {
            throw new Error(`Error creando trabajos: ${insertError.message}`);
          }

          setCurrentBatchId(batchId);
          
          toast({
            title: `✅ Archivo ${fileNum}/${totalFiles} iniciado`,
            description: `${uploadedFile.name}: Procesando ${totalChunks} chunks`,
          });

          queryClient.invalidateQueries({ queryKey: ['import-batches'] });
          resolve();

        } catch (error: any) {
          reject(error);
        }
      };

      reader.readAsBinaryString(uploadedFile);
    });
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        'Email': 'ejemplo@correo.com',
        'Nombre': 'Juan',
        'Apellido': 'Pérez',
        'Teléfono': '+58 412 1234567',
        'Cédula': 'V-12345678',
        'Ciudad': 'Caracas',
        'Fecha Nacimiento': '1990-01-15',
        'Género': 'masculino',
        'Cómo se enteró': 'Instagram'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, 'plantilla_asistentes.xlsx');

    toast({
      title: "Plantilla descargada",
      description: "Usa este formato para importar tus datos",
    });
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAllFiles = () => {
    setUploadedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelBatch = async (batchId: string) => {
    const { error } = await supabase
      .from('importaciones_queue')
      .update({ estado: 'cancelado' })
      .eq('batch_id', batchId)
      .eq('estado', 'pendiente');

    if (!error) {
      toast({
        title: "Importación cancelada",
        description: "Los chunks pendientes han sido cancelados",
      });
      queryClient.invalidateQueries({ queryKey: ['import-batches'] });
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Completado</Badge>;
      case 'en_progreso':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />En progreso</Badge>;
      case 'fallido':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Fallido</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Validación de Base de Datos
          </h1>
          <p className="text-muted-foreground mt-1">
            Importa y valida asistentes desde archivos Excel o CSV
          </p>
        </div>

        {/* File Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Download Template Card */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="w-5 h-5" />
                Descargar Plantilla
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Descarga la plantilla Excel con el formato correcto. Incluye: Email (obligatorio), Nombre, Apellido, Teléfono, Cédula, Ciudad, Género.
              </p>
              <Button 
                onClick={handleDownloadTemplate}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Descargar Plantilla
              </Button>
            </CardContent>
          </Card>

          {/* Upload and Process Card */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="w-5 h-5" />
                Importar y Procesar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sube tu archivo Excel/CSV. El sistema procesará automáticamente en chunks de {CHUNK_SIZE} registros. Tamaño máximo: {MAX_FILE_SIZE_MB}MB.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
                aria-label="Seleccionar archivos Excel o CSV para importar"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
                disabled={isProcessing}
              >
                <Upload className="w-4 h-4 mr-2" />
                Seleccionar Archivo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Drag and Drop Area or File Preview */}
        <Card className="border-none shadow-lg mb-8">
          <CardContent className="p-8">
            {uploadedFiles.length === 0 ? (
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/20'
                }`}
              >
                <Database className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {isProcessing ? 'Procesando importación...' : 'Arrastra tu archivo aquí'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  O haz clic en "Seleccionar Archivo" para elegir uno o varios archivos Excel o CSV
                </p>
                {isProcessing && (
                  <div className="mt-4">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-primary" />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium">{uploadedFiles.length} archivo(s) seleccionado(s)</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAllFiles}
                    disabled={isProcessing}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpiar Todo
                  </Button>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        disabled={isProcessing}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={handleProcessAllFiles}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Procesando {uploadedFiles.length} archivo(s)...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Procesar {uploadedFiles.length} Archivo(s)
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import History */}
        {batchSummaries.length > 0 && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Historial de Importaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {batchSummaries.map((batch) => (
                  <div key={batch.batch_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{batch.archivo_nombre}</h4>
                          {getEstadoBadge(batch.estado)}
                          {batch.genero_musical && (
                            <Badge variant="outline" className="text-xs">
                              {batch.genero_musical}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {batch.chunks_completados}/{batch.total_chunks} chunks completados
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {batch.estado === 'en_progreso' && batch.chunks_completados === 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log('🚀 Iniciando procesamiento manual para batch:', batch.batch_id);
                              setCurrentBatchId(batch.batch_id);
                              setIsProcessing(true);
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Procesar
                          </Button>
                        )}
                        {batch.estado === 'en_progreso' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelBatch(batch.batch_id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <Progress value={batch.progreso} className="h-2 mb-3" />

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-500" />
                        <span><strong>{batch.total_nuevos}</strong> nuevos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-blue-500" />
                        <span><strong>{batch.total_actualizados}</strong> actualizados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span><strong>{batch.total_errores}</strong> errores</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default DatabaseValidation;
