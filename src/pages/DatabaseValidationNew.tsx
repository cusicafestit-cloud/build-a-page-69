import { ImportSection } from "@/components/database-validation/ImportSection";
import { Layout } from "@/components/Layout";

const DatabaseValidationNew = () => {
  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Importación de Asistentes</h1>
            <p className="text-muted-foreground mt-2">
              Importa y valida datos de asistentes desde archivos Excel
            </p>
          </div>
        </div>

        <ImportSection />
      </div>
    </Layout>
  );
};

export default DatabaseValidationNew;
