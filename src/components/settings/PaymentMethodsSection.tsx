import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, CreditCard, Building2, Wallet, Smartphone, Banknote, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const iconMap: Record<string, any> = {
  CreditCard,
  Building2,
  Wallet,
  Smartphone,
  Banknote,
};

export const PaymentMethodsSection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formas_pago")
        .select("*")
        .order("orden");
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Formas de Pago</CardTitle>
            <CardDescription>
              Gestiona las formas de pago disponibles para los cursos
            </CardDescription>
          </div>
          <CreatePaymentMethodDialog />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {paymentMethods.map((method: any) => {
            const Icon = iconMap[method.icono] || CreditCard;
            return (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{method.nombre}</p>
                    <p className="text-sm text-muted-foreground">{method.descripcion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={method.activo}
                    onCheckedChange={async (checked) => {
                      const { error } = await supabase
                        .from("formas_pago")
                        .update({ activo: checked })
                        .eq("id", method.id);
                      
                      if (error) {
                        toast({
                          title: "Error",
                          description: error.message,
                          variant: "destructive",
                        });
                      } else {
                        queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
                        toast({
                          title: "Actualizado",
                          description: `Forma de pago ${checked ? "activada" : "desactivada"}`,
                        });
                      }
                    }}
                  />
                  <EditPaymentMethodDialog method={method} />
                  <DeletePaymentMethodDialog methodId={method.id} methodName={method.nombre} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const CreatePaymentMethodDialog = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    icono: "CreditCard",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("formas_pago").insert({
        nombre: data.nombre,
        descripcion: data.descripcion,
        icono: data.icono,
        activo: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Forma de pago creada",
        description: "La forma de pago se ha creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      setOpen(false);
      setFormData({ nombre: "", descripcion: "", icono: "CreditCard" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Forma de Pago
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Forma de Pago</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="icono">Icono</Label>
            <select
              id="icono"
              value={formData.icono}
              onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="CreditCard">Tarjeta de Crédito</option>
              <option value="Building2">Banco</option>
              <option value="Wallet">Billetera</option>
              <option value="Smartphone">Móvil</option>
              <option value="Banknote">Efectivo</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              Crear
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const EditPaymentMethodDialog = ({ method }: { method: any }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: method.nombre,
    descripcion: method.descripcion || "",
    icono: method.icono,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("formas_pago")
        .update({
          nombre: data.nombre,
          descripcion: data.descripcion,
          icono: data.icono,
        })
        .eq("id", method.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Forma de pago actualizada",
        description: "Los cambios se han guardado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Forma de Pago</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="icono">Icono</Label>
            <select
              id="icono"
              value={formData.icono}
              onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="CreditCard">Tarjeta de Crédito</option>
              <option value="Building2">Banco</option>
              <option value="Wallet">Billetera</option>
              <option value="Smartphone">Móvil</option>
              <option value="Banknote">Efectivo</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const DeletePaymentMethodDialog = ({ methodId, methodName }: { methodId: string; methodName: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("formas_pago")
        .delete()
        .eq("id", methodId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Forma de pago eliminada",
        description: "La forma de pago se ha eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto eliminará la forma de pago "{methodName}" permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate()}
            className="bg-destructive text-destructive-foreground"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
