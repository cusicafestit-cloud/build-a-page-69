import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type SystemUser = {
  id: string;
  nombre: string;
  email: string;
  rol: "admin" | "moderator" | "user";
  telefono?: string;
};

type EditUserDialogProps = {
  user: SystemUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export const EditUserDialog = ({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "user" as "admin" | "moderator" | "user",
    telefono: ""
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        telefono: user.telefono || ""
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Actualizar información básica del usuario
      const { error: updateError } = await supabase
        .from("usuarios_sistema")
        .update({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono || null
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Obtener el rol actual del usuario en user_roles
      const { data: currentUserRoles } = await supabase
        .from("user_roles")
        .select("id, role_id, roles!user_roles_role_id_fkey(nombre)")
        .eq("user_id", user.id);

      // Obtener el ID del rol seleccionado
      const { data: selectedRole } = await supabase
        .from("roles")
        .select("id")
        .eq("nombre", formData.rol)
        .maybeSingle();

      if (selectedRole) {
        // Verificar si ya tiene ese rol
        const hasRole = currentUserRoles?.some(
          (ur: any) => ur.roles?.nombre === formData.rol
        );

        if (!hasRole) {
          // Eliminar roles antiguos y agregar el nuevo
          if (currentUserRoles && currentUserRoles.length > 0) {
            await supabase
              .from("user_roles")
              .delete()
              .eq("user_id", user.id);
          }

          // Insertar nuevo rol
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: user.id,
              role_id: selectedRole.id
            });

          if (roleError) throw roleError;
        }
      }

      toast({
        title: "Usuario actualizado",
        description: "Los cambios se guardaron exitosamente",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Modifica los detalles del usuario del sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nombre" className="text-right">
              Nombre
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="telefono" className="text-right">
              Teléfono
            </Label>
            <Input
              id="telefono"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rol" className="text-right">
              Rol
            </Label>
            <Select value={formData.rol} onValueChange={(value: "admin" | "moderator" | "user") => setFormData({ ...formData, rol: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="moderator">Moderador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
