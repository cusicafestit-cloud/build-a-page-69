import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Users, FileText } from "lucide-react";
import { TemplatesTab } from "@/components/email/TemplatesTab";
import { CampaignsTab } from "@/components/email/CampaignsTab";

const EmailMarketing = () => {

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Email Marketing
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus campañas, plantillas y suscriptores
          </p>
        </div>

        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px] mb-8">
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Campañas
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Plantillas
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Suscriptores
            </TabsTrigger>
          </TabsList>

          {/* Tab de Campañas */}
          <TabsContent value="campaigns" className="space-y-6">
            <CampaignsTab />
          </TabsContent>

          {/* Tab de Plantillas */}
          <TabsContent value="templates" className="space-y-6">
            <TemplatesTab />
          </TabsContent>

          {/* Tab de Suscriptores */}
          <TabsContent value="subscribers" className="space-y-6">
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Suscriptores</h3>
              <p className="text-muted-foreground mb-4">
                Gestiona tu lista de suscriptores
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EmailMarketing;
