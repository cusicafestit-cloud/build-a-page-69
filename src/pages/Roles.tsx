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
  const [permissions, setPermissions] = useState<RolePermissions>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

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
      
      // Seleccionar el primer rol (admin) por defecto
      if (data && data.length > 0) {
        const adminRole = data.find(r => r.nombre === 'admin') || data[0];
        setSelectedRoleId(adminRole.id);
        loadRolePermissions(adminRole);
      }
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

  const loadRolePermissions = (role: Role) => {
    const rolePerms: RolePermissions = {};
    modules.forEach((module) => {
      rolePerms[module.id] = role.permisos?.[module.id] || {
        ver: role.nombre === 'admin',
        crear: role.nombre === 'admin',
        editar: role.nombre === 'admin',
        eliminar: role.nombre === 'admin',
      };
    });
    setPermissions(rolePerms);
  };

  const handlePermissionChange = (
    moduleId: string,
    action: keyof Permission
  ) => {
    const currentRole = roles.find(r => r.id === selectedRoleId);
    if (currentRole?.nombre === 'admin') {
      toast({
        title: "No permitido",
        description: "Los permisos del rol Admin no pueden ser modificados",
        variant: "destructive",
      });
      return;
    }

    setPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [action]: !prev[moduleId][action],
      },
    }));
    setHasChanges(true);
  };

  const handleRoleChange = (roleId: string) => {
    if (hasChanges) {
      toast({
        title: "Cambios sin guardar",
        description: "Por favor guarda los cambios antes de cambiar de rol",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedRoleId(roleId);
    const role = roles.find(r => r.id === roleId);
    if (role) {
      loadRolePermissions(role);
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("roles")
        .update({ permisos: permissions })
        .eq("id", selectedRoleId);

      if (error) throw error;

      toast({
        title: "Permisos actualizados",
        description: "Los cambios en los permisos se han guardado correctamente.",
      });
      setHasChanges(false);
      await fetchRoles();
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

  const getRoleBadge = (nombre: string) => {
    if (nombre === "admin") {
      return (
        <Badge className="bg-destructive text-destructive-foreground">
          <Crown className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    } else if (nombre === "manager") {
      return (
        <Badge className="bg-warning text-warning-foreground">
          <Shield className="w-3 h-3 mr-1" />
          Manager
        </Badge>
      );
    } else if (nombre === "staff") {
      return <Badge variant="secondary"><User className="w-3 h-3 mr-1" />Staff</Badge>;
    }
    return <Badge variant="outline">{nombre}</Badge>;
  };

  const currentRole = roles.find(r => r.id === selectedRoleId);

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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Configuración de Permisos</CardTitle>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Seleccionar Rol:</label>
              <select
                value={selectedRoleId}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="px-4 py-2 rounded-md border bg-background"
                disabled={loading}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.nombre}
                  </option>
                ))}
              </select>
              {currentRole && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditRole(currentRole)}
                  title="Editar rol"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
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
            ) : currentRole ? (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  {getRoleBadge(currentRole.nombre)}
                  <span className="text-sm text-muted-foreground">
                    {currentRole.descripcion || "Sin descripción"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Módulo</TableHead>
                        <TableHead className="text-center">Ver</TableHead>
                        <TableHead className="text-center">Crear</TableHead>
                        <TableHead className="text-center">Editar</TableHead>
                        <TableHead className="text-center">Eliminar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modules.map((module) => (
                        <TableRow key={module.id}>
                          <TableCell className="font-medium">{module.name}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={permissions[module.id]?.ver || false}
                                onCheckedChange={() =>
                                  handlePermissionChange(module.id, "ver")
                                }
                                disabled={currentRole.nombre === "admin"}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={permissions[module.id]?.crear || false}
                                onCheckedChange={() =>
                                  handlePermissionChange(module.id, "crear")
                                }
                                disabled={currentRole.nombre === "admin"}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={permissions[module.id]?.editar || false}
                                onCheckedChange={() =>
                                  handlePermissionChange(module.id, "editar")
                                }
                                disabled={currentRole.nombre === "admin"}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={permissions[module.id]?.eliminar || false}
                                onCheckedChange={() =>
                                  handlePermissionChange(module.id, "eliminar")
                                }
                                disabled={currentRole.nombre === "admin"}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Notas:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Los permisos del rol <strong>Admin</strong> no pueden ser modificados y tienen acceso completo</li>
                    <li>• Los roles del sistema no pueden ser eliminados</li>
                    <li>• Los cambios solo se aplican al guardar haciendo clic en "Guardar Cambios"</li>
                    <li>• Guarda los cambios antes de cambiar a otro rol</li>
                  </ul>
                </div>
              </div>
            ) : null}
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
