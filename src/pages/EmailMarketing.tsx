import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Users, FileText } from "lucide-react";
import { TemplatesTab } from "@/components/email/TemplatesTab";
import { CampaignsTab } from "@/components/email/CampaignsTab";
import { CampaignHistoryTab } from "@/components/email/CampaignHistoryTab";

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
              Historial
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

          {/* Tab de Historial de Campañas */}
          <TabsContent value="subscribers" className="space-y-6">
            <CampaignHistoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EmailMarketing;
