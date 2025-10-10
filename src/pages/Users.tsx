import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Search, Plus, Shield, User, Crown } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "staff";
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
};

const Users = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "staff" as const,
    password: ""
  });

  const mockUsers: SystemUser[] = [
    {
      id: "1",
      name: "Admin Principal",
      email: "admin@cusica.com",
      role: "admin",
      status: "active",
      lastLogin: "2025-01-18T10:30:00Z",
      createdAt: "2024-01-01"
    },
    {
      id: "2",
      name: "María González",
      email: "maria.manager@cusica.com",
      role: "manager",
      status: "active",
      lastLogin: "2025-01-17T15:45:00Z",
      createdAt: "2024-06-15"
    },
    {
      id: "3",
      name: "Carlos Staff",
      email: "carlos.staff@cusica.com",
      role: "staff",
      status: "active",
      lastLogin: "2025-01-16T09:20:00Z",
      createdAt: "2024-09-10"
    },
    {
      id: "4",
      name: "Ana Pérez",
      email: "ana.staff@cusica.com",
      role: "staff",
      status: "inactive",
      lastLogin: "2025-01-10T14:15:00Z",
      createdAt: "2024-11-01"
    }
  ];

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-destructive text-destructive-foreground"><Crown className="w-3 h-3 mr-1" />Admin</Badge>;
      case "manager":
        return <Badge className="bg-warning text-warning-foreground"><Shield className="w-3 h-3 mr-1" />Manager</Badge>;
      case "staff":
        return <Badge variant="secondary"><User className="w-3 h-3 mr-1" />Staff</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "active" 
      ? <Badge className="bg-success text-success-foreground">Activo</Badge>
      : <Badge variant="secondary">Inactivo</Badge>;
  };

  const handleCreateUser = () => {
    toast({
      title: "Usuario creado",
      description: `El usuario ${newUser.name} ha sido creado exitosamente.`,
    });
    setIsNewUserOpen(false);
    setNewUser({
      name: "",
      email: "",
      role: "staff",
      password: ""
    });
  };

  const stats = [
    { title: "Total Usuarios", value: mockUsers.length.toString(), icon: UserCog },
    { title: "Administradores", value: mockUsers.filter(u => u.role === "admin").length.toString(), icon: Crown },
    { title: "Managers", value: mockUsers.filter(u => u.role === "manager").length.toString(), icon: Shield },
    { title: "Staff", value: mockUsers.filter(u => u.role === "staff").length.toString(), icon: User },
  ];

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Gestión de Usuarios
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra los usuarios del sistema y sus permisos
            </p>
          </div>
          <Dialog open={isNewUserOpen} onOpenChange={setIsNewUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Completa los detalles del nuevo usuario del sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Rol
                  </Label>
                  <Select onValueChange={(value: "admin" | "manager" | "staff") => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateUser}>Crear Usuario</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
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
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">Editar</Button>
                            {user.role !== "admin" && (
                              <Button size="sm" variant="outline">
                                {user.status === "active" ? "Desactivar" : "Activar"}
                              </Button>
                            )}
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
      </div>
    </Layout>
  );
};

export default Users;
