import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Shield, Crown, User, Save } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Permission = {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
};

type RolePermissions = {
  [key: string]: Permission;
};

type Roles = {
  admin: RolePermissions;
  manager: RolePermissions;
  staff: RolePermissions;
};

const modules = [
  { id: "dashboard", name: "Dashboard" },
  { id: "events", name: "Eventos" },
  { id: "attendees", name: "Asistentes" },
  { id: "exchanges", name: "Canjes" },
  { id: "refunds", name: "Reembolsos" },
  { id: "email", name: "Email Marketing" },
  { id: "academy", name: "Academia" },
  { id: "users", name: "Usuarios" },
  { id: "database", name: "Validación BD" },
  { id: "settings", name: "Configuración" },
];

const Roles = () => {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);

  const [permissions, setPermissions] = useState<Roles>({
    admin: {
      dashboard: { ver: true, crear: true, editar: true, eliminar: true },
      events: { ver: true, crear: true, editar: true, eliminar: true },
      attendees: { ver: true, crear: true, editar: true, eliminar: true },
      exchanges: { ver: true, crear: true, editar: true, eliminar: true },
      refunds: { ver: true, crear: true, editar: true, eliminar: true },
      email: { ver: true, crear: true, editar: true, eliminar: true },
      academy: { ver: true, crear: true, editar: true, eliminar: true },
      users: { ver: true, crear: true, editar: true, eliminar: true },
      database: { ver: true, crear: true, editar: true, eliminar: true },
      settings: { ver: true, crear: true, editar: true, eliminar: true },
    },
    manager: {
      dashboard: { ver: true, crear: false, editar: false, eliminar: false },
      events: { ver: true, crear: true, editar: true, eliminar: false },
      attendees: { ver: true, crear: true, editar: true, eliminar: false },
      exchanges: { ver: true, crear: false, editar: true, eliminar: false },
      refunds: { ver: true, crear: false, editar: true, eliminar: false },
      email: { ver: true, crear: true, editar: true, eliminar: false },
      academy: { ver: true, crear: true, editar: true, eliminar: false },
      users: { ver: true, crear: false, editar: false, eliminar: false },
      database: { ver: true, crear: false, editar: false, eliminar: false },
      settings: { ver: true, crear: false, editar: false, eliminar: false },
    },
    staff: {
      dashboard: { ver: true, crear: false, editar: false, eliminar: false },
      events: { ver: true, crear: false, editar: false, eliminar: false },
      attendees: { ver: true, crear: true, editar: true, eliminar: false },
      exchanges: { ver: true, crear: false, editar: false, eliminar: false },
      refunds: { ver: true, crear: false, editar: false, eliminar: false },
      email: { ver: true, crear: false, editar: false, eliminar: false },
      academy: { ver: true, crear: false, editar: false, eliminar: false },
      users: { ver: false, crear: false, editar: false, eliminar: false },
      database: { ver: false, crear: false, editar: false, eliminar: false },
      settings: { ver: false, crear: false, editar: false, eliminar: false },
    },
  });

  const handlePermissionChange = (
    role: keyof Roles,
    moduleId: string,
    action: keyof Permission
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [moduleId]: {
          ...prev[role][moduleId],
          [action]: !prev[role][moduleId][action],
        },
      },
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    // Aquí se guardarían los cambios en la base de datos
    toast({
      title: "Permisos actualizados",
      description: "Los cambios en los permisos de roles se han guardado correctamente.",
    });
    setHasChanges(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            <Crown className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case "manager":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Shield className="w-3 h-3 mr-1" />
            Manager
          </Badge>
        );
      case "staff":
        return <Badge variant="secondary"><User className="w-3 h-3 mr-1" />Staff</Badge>;
      default:
        return null;
    }
  };

  const stats = [
    { title: "Total Módulos", value: modules.length.toString(), icon: Shield },
    { title: "Roles Configurados", value: "3", icon: Crown },
  ];

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Gestión de Roles y Permisos
            </h1>
            <p className="text-muted-foreground mt-1">
              Configura los permisos de acceso para cada rol del sistema
            </p>
          </div>
          {hasChanges && (
            <Button
              onClick={handleSaveChanges}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

        {/* Permissions Table */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Matriz de Permisos por Rol</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Módulo</TableHead>
                    {(Object.keys(permissions) as Array<keyof Roles>).map((role) => (
                      <TableHead key={role} className="text-center" colSpan={4}>
                        {getRoleBadge(role)}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableHead></TableHead>
                    {(Object.keys(permissions) as Array<keyof Roles>).map((role) => (
                      <React.Fragment key={role}>
                        <TableHead className="text-center text-xs">Ver</TableHead>
                        <TableHead className="text-center text-xs">Crear</TableHead>
                        <TableHead className="text-center text-xs">Editar</TableHead>
                        <TableHead className="text-center text-xs">Eliminar</TableHead>
                      </React.Fragment>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell className="font-medium">{module.name}</TableCell>
                      {(Object.keys(permissions) as Array<keyof Roles>).map((role) => (
                        <React.Fragment key={role}>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={permissions[role][module.id]?.ver || false}
                                onCheckedChange={() =>
                                  handlePermissionChange(role, module.id, "ver")
                                }
                                disabled={role === "admin"}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={permissions[role][module.id]?.crear || false}
                                onCheckedChange={() =>
                                  handlePermissionChange(role, module.id, "crear")
                                }
                                disabled={role === "admin"}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={permissions[role][module.id]?.editar || false}
                                onCheckedChange={() =>
                                  handlePermissionChange(role, module.id, "editar")
                                }
                                disabled={role === "admin"}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={permissions[role][module.id]?.eliminar || false}
                                onCheckedChange={() =>
                                  handlePermissionChange(role, module.id, "eliminar")
                                }
                                disabled={role === "admin"}
                              />
                            </div>
                          </TableCell>
                        </React.Fragment>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Notas:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Los permisos del rol <strong>Admin</strong> no pueden ser modificados</li>
                <li>• Los cambios solo se aplican al guardar haciendo clic en "Guardar Cambios"</li>
                <li>• Los usuarios activos con estos roles verán los cambios en su próximo inicio de sesión</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Roles;
