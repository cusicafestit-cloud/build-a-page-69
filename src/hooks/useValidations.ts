import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ValidacionBD, ValidationHealthStatus } from "@/types/database-validation";
import { toast } from "sonner";

export const useValidations = () => {
  const queryClient = useQueryClient();

  const { data: validations, isLoading } = useQuery({
    queryKey: ["validaciones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("validaciones_bd")
        .select("*")
        .order("nombre");

      if (error) throw error;
      return data as ValidacionBD[];
    },
  });

  const executeValidation = useMutation({
    mutationFn: async (validationId: string) => {
      const { data, error } = await supabase.functions.invoke(
        "execute-validation-check",
        {
          body: { validation_id: validationId },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validaciones"] });
      toast.success("Validación ejecutada exitosamente");
    },
    onError: (error: any) => {
      toast.error(`Error al ejecutar validación: ${error.message}`);
    },
  });

  const executeAllValidations = useMutation({
    mutationFn: async () => {
      if (!validations) return;
      
      const activeValidations = validations.filter(v => v.activa);
      const results = [];
      
      for (const validation of activeValidations) {
        try {
          const result = await supabase.functions.invoke(
            "execute-validation-check",
            {
              body: { validation_id: validation.id },
            }
          );
          results.push(result);
        } catch (error) {
          console.error(`Error ejecutando validación ${validation.nombre}:`, error);
        }
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validaciones"] });
      toast.success("Todas las validaciones ejecutadas");
    },
    onError: (error: any) => {
      toast.error(`Error al ejecutar validaciones: ${error.message}`);
    },
  });

  const healthStatus: ValidationHealthStatus | null = validations
    ? {
        total: validations.length,
        passed: validations.filter(
          (v) => v.estado === "completado" && v.problemas_encontrados === 0
        ).length,
        warnings: validations.filter(
          (v) =>
            v.estado === "completado" &&
            v.problemas_encontrados > 0 &&
            v.problemas_encontrados < v.umbral_error
        ).length,
        errors: validations.filter(
          (v) =>
            v.estado === "completado" &&
            v.problemas_encontrados >= v.umbral_error
        ).length,
        lastExecution:
          validations
            .filter((v) => v.ultima_ejecucion)
            .sort(
              (a, b) =>
                new Date(b.ultima_ejecucion!).getTime() -
                new Date(a.ultima_ejecucion!).getTime()
            )[0]?.ultima_ejecucion || null,
        averageDuration:
          validations.filter((v) => v.duracion_segundos > 0).length > 0
            ? validations
                .filter((v) => v.duracion_segundos > 0)
                .reduce((acc, v) => acc + v.duracion_segundos, 0) /
              validations.filter((v) => v.duracion_segundos > 0).length
            : 0,
        healthPercentage:
          validations.length > 0
            ? (validations.filter(
                (v) => v.estado === "completado" && v.problemas_encontrados === 0
              ).length /
                validations.length) *
              100
            : 0,
      }
    : null;

  return {
    validations,
    isLoading,
    executeValidation,
    executeAllValidations,
    healthStatus,
  };
};
