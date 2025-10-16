import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Settings as SettingsIcon, Bell, Mail, Shield, Palette, Database, Upload } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  
  const [generalSettings, setGeneralSettings] = useState({
    companyName: "Cusica Events",
    companyEmail: "admin@cusica.com",
    companyPhone: "+58 412 123 4567",
    address: "Caracas, Venezuela",
    timezone: "America/Caracas"
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: true,
    eventReminders: true
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpServer: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "noreply@cusica.com",
    smtpPassword: "••••••••",
    fromName: "Cusica Events",
    fromEmail: "noreply@cusica.com"
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    passwordExpiry: "90",
    loginAttempts: "5"
  });

  const [exchangeSettings, setExchangeSettings] = useState({
    canjesAutomaticos: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('configuraciones_sistema')
        .select('*');

      if (error) throw error;

      if (data) {
        data.forEach((config) => {
          const valor = config.valor || config.valor_por_defecto;
          
          if (config.clave === 'logoUrl') {
            setLogoUrl(valor);
          } else if (config.clave === 'faviconUrl') {
            setFaviconUrl(valor);
          } else if (config.categoria === 'general') {
            setGeneralSettings(prev => ({
              ...prev,
              [config.clave]: valor
            }));
          } else if (config.categoria === 'notificaciones') {
            setNotifications(prev => ({
              ...prev,
              [config.clave]: valor === 'true'
            }));
          } else if (config.categoria === 'email') {
            setEmailSettings(prev => ({
              ...prev,
              [config.clave]: valor
            }));
          } else if (config.categoria === 'seguridad') {
            setSecuritySettings(prev => ({
              ...prev,
              [config.clave]: valor === 'true' ? true : valor
            }));
          } else if (config.categoria === 'canjes') {
            setExchangeSettings(prev => ({
              ...prev,
              [config.clave]: valor === 'true'
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen.",
        variant: "destructive"
      });
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen debe ser menor a 2MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingLogo(true);
    try {
      // Eliminar logo anterior si existe
      if (logoUrl) {
        const oldPath = logoUrl.split('/logos/')[1];
        if (oldPath) {
          await supabase.storage.from('logos').remove([oldPath]);
        }
      }

      // Subir nuevo logo
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);

      // Guardar en configuraciones
      await supabase
        .from('configuraciones_sistema')
        .upsert({
          clave: 'logoUrl',
          valor: publicUrl,
          categoria: 'apariencia',
          descripcion: 'URL del logo de la empresa'
        }, {
          onConflict: 'clave'
        });

      toast({
        title: "Logo actualizado",
        description: "El logo ha sido cambiado exitosamente.",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el logo.",
        variant: "destructive"
      });
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen.",
        variant: "destructive"
      });
      return;
    }

    // Validar tamaño (máximo 1MB para favicon)
    if (file.size > 1024 * 1024) {
      toast({
        title: "Error",
        description: "El favicon debe ser menor a 1MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingFavicon(true);
    try {
      // Eliminar favicon anterior si existe
      if (faviconUrl) {
        const oldPath = faviconUrl.split('/logos/')[1];
        if (oldPath) {
          await supabase.storage.from('logos').remove([oldPath]);
        }
      }

      // Subir nuevo favicon
      const fileExt = file.name.split('.').pop();
      const fileName = `favicon-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      setFaviconUrl(publicUrl);

      // Guardar en configuraciones
      await supabase
        .from('configuraciones_sistema')
        .upsert({
          clave: 'faviconUrl',
          valor: publicUrl,
          categoria: 'apariencia',
          descripcion: 'URL del favicon de la empresa'
        }, {
          onConflict: 'clave'
        });

      // Actualizar el favicon en el DOM
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'icon';
      link.href = publicUrl;
      if (!document.querySelector("link[rel*='icon']")) {
        document.getElementsByTagName('head')[0].appendChild(link);
      }

      toast({
        title: "Favicon actualizado",
        description: "El favicon ha sido cambiado exitosamente. Recarga la página para ver los cambios.",
      });
    } catch (error) {
      console.error('Error uploading favicon:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el favicon.",
        variant: "destructive"
      });
    } finally {
      setUploadingFavicon(false);
      if (faviconInputRef.current) {
        faviconInputRef.current.value = '';
      }
    }
  };

  const saveSettings = async (categoria: string, settings: any) => {
    setLoading(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('configuraciones_sistema')
          .upsert({
            clave: key,
            valor: String(value),
            categoria,
            descripcion: `Configuración de ${key}`
          }, {
            onConflict: 'clave'
          });

        if (error) throw error;
      }

      toast({
        title: "Configuración guardada",
        description: "Los cambios han sido guardados exitosamente.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las configuraciones.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = () => {
    saveSettings('general', generalSettings);
  };

  const handleSaveNotifications = () => {
    saveSettings('notificaciones', notifications);
  };

  const handleSaveEmail = () => {
    saveSettings('email', emailSettings);
  };

  const handleSaveSecurity = () => {
    saveSettings('seguridad', securitySettings);
  };

  const handleSaveExchange = () => {
    saveSettings('canjes', exchangeSettings);
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Configuración del Sistema
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las configuraciones generales de la plataforma
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Seguridad
            </TabsTrigger>
            <TabsTrigger value="exchange" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Canjes
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Apariencia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nombre de la Empresa</Label>
                    <Input
                      id="company-name"
                      value={generalSettings.companyName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-email">Email Corporativo</Label>
                    <Input
                      id="company-email"
                      type="email"
                      value={generalSettings.companyEmail}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, companyEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">Teléfono</Label>
                    <Input
                      id="company-phone"
                      value={generalSettings.companyPhone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, companyPhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zona Horaria</Label>
                    <select
                      id="timezone"
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="America/Caracas">Caracas, Venezuela (GMT-4)</option>
                      <option value="America/Bogota">Bogotá, Colombia (GMT-5)</option>
                      <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                      <option value="America/New_York">Nueva York (GMT-5)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Textarea
                    id="address"
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button onClick={handleSaveGeneral} disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Preferencias de Notificación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">Recibir notificaciones importantes por email</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones SMS</Label>
                    <p className="text-sm text-muted-foreground">Recibir alertas críticas por SMS</p>
                  </div>
                  <Switch
                    checked={notifications.smsNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, smsNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones Push</Label>
                    <p className="text-sm text-muted-foreground">Notificaciones en tiempo real en el navegador</p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Emails de Marketing</Label>
                    <p className="text-sm text-muted-foreground">Recibir información sobre nuevas funciones</p>
                  </div>
                  <Switch
                    checked={notifications.marketingEmails}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, marketingEmails: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Recordatorios de Eventos</Label>
                    <p className="text-sm text-muted-foreground">Recordatorios automáticos de eventos próximos</p>
                  </div>
                  <Switch
                    checked={notifications.eventReminders}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, eventReminders: checked })}
                  />
                </div>
                <Button onClick={handleSaveNotifications} disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Preferencias"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Configuración SMTP</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-server">Servidor SMTP</Label>
                    <Input
                      id="smtp-server"
                      value={emailSettings.smtpServer}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpServer: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">Puerto</Label>
                    <Input
                      id="smtp-port"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">Usuario SMTP</Label>
                    <Input
                      id="smtp-user"
                      value={emailSettings.smtpUser}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">Contraseña</Label>
                    <Input
                      id="smtp-password"
                      type="password"
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-name">Nombre del Remitente</Label>
                    <Input
                      id="from-name"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-email">Email del Remitente</Label>
                    <Input
                      id="from-email"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveEmail} disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Configuración"}
                  </Button>
                  <Button variant="outline">Probar Conexión</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Configuración de Seguridad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticación de Dos Factores</Label>
                    <p className="text-sm text-muted-foreground">Requiere verificación adicional al iniciar sesión</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Tiempo de Sesión (minutos)</Label>
                    <Input
                      id="session-timeout"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-expiry">Expiración de Contraseña (días)</Label>
                    <Input
                      id="password-expiry"
                      value={securitySettings.passwordExpiry}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, passwordExpiry: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-attempts">Intentos de Login Máximos</Label>
                  <Input
                    id="login-attempts"
                    value={securitySettings.loginAttempts}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, loginAttempts: e.target.value })}
                    className="max-w-xs"
                  />
                </div>
                <Button onClick={handleSaveSecurity} disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exchange" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Configuración de Canjes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aprobación Automática de Canjes</Label>
                    <p className="text-sm text-muted-foreground">
                      Las solicitudes de canjes entrantes se aprobarán automáticamente sin revisión manual
                    </p>
                  </div>
                  <Switch
                    checked={exchangeSettings.canjesAutomaticos}
                    onCheckedChange={(checked) => setExchangeSettings({ ...exchangeSettings, canjesAutomaticos: checked })}
                  />
                </div>
                <Button onClick={handleSaveExchange} disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Personalización de Apariencia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>Tema de Color</Label>
                    <p className="text-sm text-muted-foreground mb-3">Selecciona el esquema de colores de la aplicación</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg cursor-pointer hover:border-primary">
                        <div className="w-full h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded mb-2"></div>
                        <p className="text-sm font-medium">Cusica (Actual)</p>
                      </div>
                      <div className="p-4 border rounded-lg cursor-pointer hover:border-primary">
                        <div className="w-full h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded mb-2"></div>
                        <p className="text-sm font-medium">Verde</p>
                      </div>
                      <div className="p-4 border rounded-lg cursor-pointer hover:border-primary">
                        <div className="w-full h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded mb-2"></div>
                        <p className="text-sm font-medium">Naranja</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo-upload">Logo de la Empresa</Label>
                    <div className="flex items-center gap-4">
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt="Logo" 
                          className="w-16 h-16 object-contain rounded-lg border border-border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-xl">C</span>
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingLogo}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingLogo ? "Subiendo..." : "Cambiar Logo"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG o WEBP (máx. 2MB)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="favicon-upload">Favicon (Ícono del Navegador)</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Este ícono aparece en la pestaña del navegador y en los favoritos
                    </p>
                    <div className="flex items-center gap-4">
                      {faviconUrl ? (
                        <img 
                          src={faviconUrl} 
                          alt="Favicon" 
                          className="w-8 h-8 object-contain rounded border border-border"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded flex items-center justify-center">
                          <span className="text-white font-bold text-xs">C</span>
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <input
                          ref={faviconInputRef}
                          type="file"
                          id="favicon-upload"
                          accept="image/*"
                          onChange={handleFaviconUpload}
                          className="hidden"
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => faviconInputRef.current?.click()}
                          disabled={uploadingFavicon}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingFavicon ? "Subiendo..." : "Cambiar Favicon"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          ICO, PNG o JPG (máx. 1MB, recomendado 32x32px)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button>Guardar Apariencia</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
