import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Database, CheckCircle, XCircle, AlertTriangle, RefreshCw, Play, Download, Upload, FileSpreadsheet, X, Clock, Users, FileCheck } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from 'xlsx';

type ValidationCheck = {
  id: string;
  name: string;
  description: string;
  status: "passed" | "failed" | "warning" | "running" | "pending";
  lastRun: string;
  duration: number;
  issues?: number;
};

const DatabaseValidation = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validationChecks: ValidationCheck[] = [
    {
      id: "1",
      name: "Integridad de Eventos",
      description: "Verifica que todos los eventos tengan datos completos y válidos",
      status: "passed",
      lastRun: "2025-01-18T10:30:00Z",
      duration: 2.3,
      issues: 0
    },
    {
      id: "2",
      name: "Consistencia de Tickets",
      description: "Valida la relación entre eventos y tipos de tickets",
      status: "warning",
      lastRun: "2025-01-18T10:30:00Z",
      duration: 1.8,
      issues: 3
    },
    {
      id: "3",
      name: "Duplicados de Asistentes",
      description: "Detecta registros duplicados en la base de asistentes",
      status: "failed",
      lastRun: "2025-01-18T10:30:00Z",
      duration: 4.1,
      issues: 12
    },
    {
      id: "4",
      name: "Validación de Emails",
      description: "Verifica formato y validez de direcciones de email",
      status: "passed",
      lastRun: "2025-01-18T10:30:00Z",
      duration: 3.2,
      issues: 0
    },
    {
      id: "5",
      name: "Coherencia de Canjes",
      description: "Valida la lógica de intercambios de tickets",
      status: "warning",
      lastRun: "2025-01-18T10:30:00Z",
      duration: 1.5,
      issues: 2
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge className="bg-green-500 text-white hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Pasó</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Falló</Badge>;
      case "warning":
        return <Badge className="bg-amber-500 text-white hover:bg-amber-600"><AlertTriangle className="w-3 h-3 mr-1" />Advertencia</Badge>;
      case "running":
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Ejecutando</Badge>;
      case "pending":
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRunAllChecks = async () => {
    setIsRunning(true);
    toast({
      title: "Validación iniciada",
      description: "Ejecutando todas las validaciones de base de datos...",
    });

    // Simulate validation process
    setTimeout(() => {
      setIsRunning(false);
      toast({
        title: "Validación completada",
        description: "Todas las validaciones han sido ejecutadas.",
      });
    }, 3000);
  };

  const handleRunSingleCheck = (checkName: string) => {
    toast({
      title: "Validación ejecutada",
      description: `Ejecutando validación: ${checkName}`,
    });
  };

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
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor sube un archivo Excel (.xlsx, .xls) o CSV",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    toast({
      title: "Archivo cargado",
      description: `${file.name} está listo para validar`,
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleValidateFile = async () => {
    if (!uploadedFile) return;

    setIsValidating(true);
    toast({
      title: "Validando archivo",
      description: "Procesando y validando los datos del archivo...",
    });

    // Simulate validation
    setTimeout(() => {
      setValidationResults({
        totalRecords: 150,
        validRecords: 142,
        invalidRecords: 8,
        duplicates: 3,
        missingFields: 5
      });
      setIsValidating(false);
      toast({
        title: "Validación completada",
        description: "El archivo ha sido validado exitosamente",
      });
    }, 3000);
  };

  const handleDownloadTemplate = () => {
    toast({
      title: "Descargando plantilla",
      description: "La plantilla Excel se está descargando...",
    });
    // Here you would implement actual download logic
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setValidationResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stats = [
    { 
      title: "Total Validaciones", 
      value: validationChecks.length.toString(), 
      icon: Database 
    },
    { 
      title: "Pasaron", 
      value: validationChecks.filter(c => c.status === "passed").length.toString(), 
      icon: CheckCircle 
    },
    { 
      title: "Fallaron", 
      value: validationChecks.filter(c => c.status === "failed").length.toString(), 
      icon: XCircle 
    },
    { 
      title: "Total Issues", 
      value: validationChecks.reduce((sum, c) => sum + (c.issues || 0), 0).toString(), 
      icon: AlertTriangle 
    },
  ];

  const overallHealth = validationChecks.filter(c => c.status === "passed").length / validationChecks.length * 100;

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Validación de Base de Datos
          </h1>
          <p className="text-muted-foreground mt-1">
            Importa y valida correos electrónicos contra la base de datos existente
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
                Descarga la plantilla Excel con el formato correcto para la importación. Incluye columnas: Nombre, Email, Teléfono, Empresa.
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

          {/* Upload and Validate Card */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="w-5 h-5" />
                Importar y Validar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sube tu archivo Excel para validar los correos contra la base de datos. El sistema identificará automáticamente contactos existentes y nuevos.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInputChange}
                className="hidden"
                aria-label="Seleccionar archivo Excel o CSV para validar"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
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
            {!uploadedFile && !validationResults ? (
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
                <h3 className="text-xl font-semibold mb-2">No hay resultados de validación</h3>
                <p className="text-muted-foreground mb-6">
                  Descarga la plantilla, complétala con tus datos y súbela para validar los correos electrónicos
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    variant="outline"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Plantilla
                  </Button>
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Archivo
                  </Button>
                </div>
              </div>
            ) : uploadedFile && !validationResults ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-10 h-10 text-primary" />
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  onClick={handleValidateFile}
                  disabled={isValidating}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Validar Archivo
                    </>
                  )}
                </Button>
              </div>
            ) : validationResults && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Resultados de Validación</h3>
                    <p className="text-sm text-muted-foreground">
                      Archivo: {uploadedFile?.name}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpiar
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total de Registros</p>
                    <p className="text-3xl font-bold text-blue-600">{validationResults.totalRecords}</p>
                  </div>
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Registros Válidos</p>
                    <p className="text-3xl font-bold text-green-600">{validationResults.validRecords}</p>
                  </div>
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Registros Inválidos</p>
                    <p className="text-3xl font-bold text-red-600">{validationResults.invalidRecords}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <p className="font-medium">Duplicados Encontrados</p>
                    </div>
                    <p className="text-2xl font-bold">{validationResults.duplicates}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <p className="font-medium">Campos Faltantes</p>
                    </div>
                    <p className="text-2xl font-bold">{validationResults.missingFields}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Resultados
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Otro Archivo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-background text-muted-foreground">
              Validaciones Automáticas del Sistema
            </span>
          </div>
        </div>

        {/* Existing Validation Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Validaciones de Integridad</h2>
            <p className="text-muted-foreground mt-1">
              Monitorea la integridad y consistencia de los datos del sistema
            </p>
          </div>
          <Button 
            onClick={handleRunAllChecks}
            disabled={isRunning}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isRunning ? "Ejecutando..." : "Ejecutar Todas"}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Overall Health */}
        <Card className="border-none shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Estado General de la Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Salud General</span>
                <span className="text-2xl font-bold">{Math.round(overallHealth)}%</span>
              </div>
              <Progress value={overallHealth} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {overallHealth >= 80 ? "Base de datos en buen estado" : 
                 overallHealth >= 60 ? "Base de datos requiere atención" : 
                 "Base de datos requiere atención inmediata"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Validation Checks Table */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Validaciones de Integridad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Validación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Última Ejecución</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationChecks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{check.name}</div>
                          <div className="text-sm text-muted-foreground">{check.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(check.status)}</TableCell>
                      <TableCell>
                        {check.issues !== undefined && (
                          <span className={`font-medium ${check.issues > 0 ? 'text-destructive' : 'text-green-600'}`}>
                            {check.issues}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(check.lastRun).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {check.duration}s
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRunSingleCheck(check.name)}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Ejecutar
                          </Button>
                          {check.issues && check.issues > 0 && (
                            <Button size="sm" variant="outline">
                              Ver Detalles
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DatabaseValidation;
