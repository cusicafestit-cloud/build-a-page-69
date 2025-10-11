import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatabaseHealthDashboard } from "@/components/database-validation/DatabaseHealthDashboard";
import { ValidationChecksSection } from "@/components/database-validation/ValidationChecksSection";
import { ImportSection } from "@/components/database-validation/ImportSection";
import { useValidations } from "@/hooks/useValidations";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Upload, CheckSquare } from "lucide-react";
import { Layout } from "@/components/Layout";

const DatabaseValidationNew = () => {
  const queryClient = useQueryClient();
  const {
    validations,
    isLoading,
    executeValidation,
    executeAllValidations,
    healthStatus,
  } = useValidations();

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("validaciones-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "validaciones_bd",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["validaciones"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Validación y Diagnóstico de Base de Datos</h1>
            <p className="text-muted-foreground mt-2">
              Monitoreo de integridad, importaciones y salud general del sistema
            </p>
          </div>
        </div>

        <Tabs defaultValue="health" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="validations" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Validaciones
            </TabsTrigger>
            <TabsTrigger value="imports" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="space-y-6">
            <DatabaseHealthDashboard healthStatus={healthStatus} />
          </TabsContent>

          <TabsContent value="validations" className="space-y-6">
            <ValidationChecksSection
              validations={validations}
              isLoading={isLoading}
              onExecute={(id) => executeValidation.mutate(id)}
              onExecuteAll={() => executeAllValidations.mutate()}
              isExecuting={
                executeValidation.isPending || executeAllValidations.isPending
              }
            />
          </TabsContent>

          <TabsContent value="imports" className="space-y-6">
            <ImportSection />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default DatabaseValidationNew;
