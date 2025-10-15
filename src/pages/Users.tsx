import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Search, Plus, Shield, User, Crown, Edit, Trash2, Power, Settings2, Eye } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EditUserDialog } from "@/components/users/EditUserDialog";
import { DeleteUserDialog } from "@/components/users/DeleteUserDialog";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { useNavigate } from "react-router-dom";

type AuthUser = {
  id: string;
  email: string;
  nombre: string;
  created_at: string;
  last_sign_in_at?: string;
  rol?: "admin" | "manager" | "staff";
  telefono?: string;
  roles: Array<{
    id: string;
    role_id: string;
    role_nombre: string;
    role_descripcion?: string;
  }>;
};

const Users = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);

  // Consultar usuarios con roles asignados
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_users_with_roles");

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.user_id,
        email: row.user_email,
        nombre: row.user_nombre,
        created_at: row.user_created_at,
        roles: row.roles || [],
      })) as AuthUser[];
    },
  });

  const { data: availableRoles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .eq("activo", true)
        .order("nombre");
      
      if (error) throw error;
      return data || [];
    },
  });

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roles.some(r => r.role_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleBadge = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case "admin":
        return <Badge className="bg-destructive text-destructive-foreground"><Crown className="w-3 h-3 mr-1" />Admin</Badge>;
      case "moderator":
      case "manager":
        return <Badge className="bg-warning text-warning-foreground"><Shield className="w-3 h-3 mr-1" />{roleName}</Badge>;
      case "user":
      case "staff":
        return <Badge variant="secondary"><User className="w-3 h-3 mr-1" />{roleName}</Badge>;
      default:
        return <Badge variant="outline">{roleName}</Badge>;
    }
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role_id: roleId,
        });

      if (error) throw error;

      toast({
        title: "Rol asignado",
        description: "El rol ha sido asignado exitosamente",
      });
      
      refetch();
      setAssignRoleDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el rol",
        variant: "destructive"
      });
    }
  };

  const handleRemoveRole = async (userRoleId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", userRoleId);

      if (error) throw error;

      toast({
        title: "Rol removido",
        description: "El rol ha sido removido exitosamente",
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo remover el rol",
        variant: "destructive"
      });
    }
  };

  const handleEditUser = async (user: AuthUser) => {
    try {
      // Obtener datos completos del usuario de usuarios_sistema
      const { data: systemUser, error } = await supabase
        .from("usuarios_sistema")
        .select("id, nombre, email, rol, telefono")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setEditingUser(systemUser);
      setEditUserDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar la información del usuario",
        variant: "destructive"
      });
    }
  };

  const stats = [
    { title: "Total Usuarios", value: users.length.toString(), icon: UserCog },
    { title: "Con Rol Admin", value: users.filter(u => u.roles.some(r => r.role_nombre === "admin")).length.toString(), icon: Crown },
    { title: "Con Roles Asignados", value: users.filter(u => u.roles.length > 0).length.toString(), icon: Shield },
    { title: "Sin Roles", value: users.filter(u => u.roles.length === 0).length.toString(), icon: User },
  ];

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Gestión de Usuarios y Roles
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra los usuarios registrados y sus roles asignados
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCreateUserDialogOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/roles")}
              className="border-primary/20 hover:bg-primary/10"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Gestión de Roles
            </Button>
          </div>
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

        {/* Users Table */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Usuarios del Sistema ({filteredUsers.length})</CardTitle>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Roles Asignados</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <div className="text-muted-foreground">Cargando usuarios...</div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm 
                            ? "No se encontraron usuarios con los filtros aplicados"
                            : "No hay usuarios registrados"
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.nombre}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.length === 0 ? (
                              <Badge variant="outline" className="text-xs">Sin roles</Badge>
                            ) : (
                              user.roles.map((role) => (
                                <div key={role.id} className="flex items-center gap-1">
                                  {getRoleBadge(role.role_nombre)}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5"
                                    onClick={() => handleRemoveRole(role.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.last_sign_in_at 
                            ? new Date(user.last_sign_in_at).toLocaleDateString()
                            : "Nunca"
                          }
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSelectedUser(user);
                                setViewUserDialogOpen(true);
                              }}
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditUser(user)}
                              title="Editar usuario"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteUserDialogOpen(true);
                              }}
                              title="Eliminar usuario"
                              className="hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={assignRoleDialogOpen} onOpenChange={setAssignRoleDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Asignar Rol</DialogTitle>
              <DialogDescription>
                Selecciona un rol para asignar a {selectedUser?.nombre || selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {availableRoles
                .filter(role => !selectedUser?.roles.some(ur => ur.role_id === role.id))
                .map((role) => (
                  <Button
                    key={role.id}
                    variant="outline"
                    className="justify-start"
                    onClick={() => selectedUser && handleAssignRole(selectedUser.id, role.id)}
                  >
                    {getRoleBadge(role.nombre)}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {role.descripcion}
                    </span>
                  </Button>
                ))}
              {availableRoles.filter(role => !selectedUser?.roles.some(ur => ur.role_id === role.id)).length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  Este usuario ya tiene todos los roles disponibles asignados
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* View User Dialog */}
        <Dialog open={viewUserDialogOpen} onOpenChange={setViewUserDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Detalles del Usuario</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{selectedUser.nombre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Registro</Label>
                  <p className="font-medium">{new Date(selectedUser.created_at).toLocaleString('es-ES')}</p>
                </div>
                {selectedUser.last_sign_in_at && (
                  <div>
                    <Label className="text-muted-foreground">Último Login</Label>
                    <p className="font-medium">{new Date(selectedUser.last_sign_in_at).toLocaleString('es-ES')}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground mb-2">Roles Asignados</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUser.roles.length === 0 ? (
                      <Badge variant="outline">Sin roles asignados</Badge>
                    ) : (
                      selectedUser.roles.map((role) => (
                        <div key={role.id}>
                          {getRoleBadge(role.role_nombre)}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewUserDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <EditUserDialog
          user={editingUser}
          open={editUserDialogOpen}
          onOpenChange={setEditUserDialogOpen}
          onSuccess={refetch}
        />

        <DeleteUserDialog
          user={selectedUser ? {
            id: selectedUser.id,
            nombre: selectedUser.nombre,
            email: selectedUser.email
          } : null}
          open={deleteUserDialogOpen}
          onOpenChange={setDeleteUserDialogOpen}
          onSuccess={refetch}
        />

        <CreateUserDialog
          open={createUserDialogOpen}
          onOpenChange={setCreateUserDialogOpen}
          onSuccess={refetch}
        />
      </div>
    </Layout>
  );
};

export default Users;
