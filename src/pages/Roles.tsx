import React, { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Shield, Crown, User, Save, Plus, Pencil, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreateRoleDialog } from "@/components/roles/CreateRoleDialog";
import { EditRoleDialog } from "@/components/roles/EditRoleDialog";

type Permission = {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
};

type RolePermissions = {
  [key: string]: Permission;
};

type Role = {
  id: string;
  nombre: string;
  descripcion: string | null;
  es_sistema: boolean;
  activo: boolean;
  permisos: any;
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
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<{ [roleId: string]: RolePermissions }>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("es_sistema", { ascending: false })
        .order("nombre");

      if (error) throw error;

      setRoles(data || []);
      
      // Inicializar permisos desde la base de datos
      const initialPermissions: { [roleId: string]: RolePermissions } = {};
      data?.forEach((role) => {
        const rolePerms: RolePermissions = {};
        modules.forEach((module) => {
          rolePerms[module.id] = role.permisos?.[module.id] || {
            ver: false,
            crear: false,
            editar: false,
            eliminar: false,
          };
        });
        initialPermissions[role.id] = rolePerms;
      });
      setPermissions(initialPermissions);
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (
    roleId: string,
    moduleId: string,
    action: keyof Permission
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [moduleId]: {
          ...prev[roleId][moduleId],
          [action]: !prev[roleId][moduleId][action],
        },
      },
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      // Guardar permisos para cada rol
      for (const role of roles) {
        const { error } = await supabase
          .from("roles")
          .update({ permisos: permissions[role.id] })
          .eq("id", role.id);

        if (error) throw error;
      }

      toast({
        title: "Permisos actualizados",
        description: "Los cambios en los permisos de roles se han guardado correctamente.",
      });
      setHasChanges(false);
    } catch (error: any) {
      console.error("Error saving permissions:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setEditDialogOpen(true);
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
    { title: "Roles Configurados", value: roles.length.toString(), icon: Crown },
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
          <div className="flex gap-2">
            <Button
              onClick={() => setCreateDialogOpen(true)}
              variant="outline"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Rol
            </Button>
            {hasChanges && (
              <Button
                onClick={handleSaveChanges}
                disabled={loading}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar Cambios
              </Button>
            )}
          </div>
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
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No hay roles configurados</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Rol
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Módulo</TableHead>
                      {roles.map((role) => (
                        <TableHead key={role.id} className="text-center" colSpan={5}>
                          <div className="flex items-center justify-center gap-2">
                            {getRoleBadge(role.nombre)}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEditRole(role)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableHead></TableHead>
                      {roles.map((role) => (
                        <React.Fragment key={role.id}>
                          <TableHead className="text-center text-xs">Ver</TableHead>
                          <TableHead className="text-center text-xs">Crear</TableHead>
                          <TableHead className="text-center text-xs">Editar</TableHead>
                          <TableHead className="text-center text-xs">Eliminar</TableHead>
                          <TableHead className="w-6"></TableHead>
                        </React.Fragment>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((module) => (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">{module.name}</TableCell>
                        {roles.map((role) => (
                          <React.Fragment key={role.id}>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Switch
                                  checked={permissions[role.id]?.[module.id]?.ver || false}
                                  onCheckedChange={() =>
                                    handlePermissionChange(role.id, module.id, "ver")
                                  }
                                  disabled={role.nombre === "admin"}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Switch
                                  checked={permissions[role.id]?.[module.id]?.crear || false}
                                  onCheckedChange={() =>
                                    handlePermissionChange(role.id, module.id, "crear")
                                  }
                                  disabled={role.nombre === "admin"}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Switch
                                  checked={permissions[role.id]?.[module.id]?.editar || false}
                                  onCheckedChange={() =>
                                    handlePermissionChange(role.id, module.id, "editar")
                                  }
                                  disabled={role.nombre === "admin"}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Switch
                                  checked={permissions[role.id]?.[module.id]?.eliminar || false}
                                  onCheckedChange={() =>
                                    handlePermissionChange(role.id, module.id, "eliminar")
                                  }
                                  disabled={role.nombre === "admin"}
                                />
                              </div>
                            </TableCell>
                            <TableCell></TableCell>
                          </React.Fragment>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!loading && roles.length > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Notas:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Los permisos del rol <strong>Admin</strong> no pueden ser modificados</li>
                  <li>• Los roles del sistema no pueden ser eliminados</li>
                  <li>• Los cambios solo se aplican al guardar haciendo clic en "Guardar Cambios"</li>
                  <li>• Los usuarios activos con estos roles verán los cambios en su próximo inicio de sesión</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <CreateRoleDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={fetchRoles}
        />

        <EditRoleDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          role={selectedRole}
          onSuccess={fetchRoles}
        />
      </div>
    </Layout>
  );
};

export default Roles;
