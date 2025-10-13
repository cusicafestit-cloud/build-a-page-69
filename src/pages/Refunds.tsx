import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DollarSign, Search, CheckCircle, XCircle, Clock, Eye, Edit } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateRefundDialog } from "@/components/refunds/CreateRefundDialog";
import { ViewRefundDialog } from "@/components/refunds/ViewRefundDialog";
import { EditRefundDialog } from "@/components/refunds/EditRefundDialog";

type Refund = {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  event: string;
  ticketType: string;
  amount: number;
  status: "pending" | "approved" | "processed" | "rejected";
  requestDate: string;
  reason: string;
};

const Refunds = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchAttendee, setSearchAttendee] = useState("");
  const [searchEvent, setSearchEvent] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);

  const { data: refunds = [], isLoading } = useQuery({
    queryKey: ["refunds", searchAttendee, searchEvent, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from("reembolsos")
        .select(`
          *,
          asistente:asistentes!inner(nombre, apellido, email),
          evento:eventos!inner(nombre),
          tipo_ticket:tipos_tickets(tipo)
        `)
        .order("created_at", { ascending: false });

      if (searchAttendee) {
        query = query.or(`asistentes.nombre.ilike.%${searchAttendee}%,asistentes.apellido.ilike.%${searchAttendee}%,asistentes.email.ilike.%${searchAttendee}%`);
      }

      if (searchEvent) {
        query = query.ilike("eventos.nombre", `%${searchEvent}%`);
      }

      if (filterStatus !== "all") {
        query = query.eq("estado", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case "approved":
        return <Badge className="bg-green-500 text-white hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>;
      case "processed":
        return <Badge className="bg-primary text-primary-foreground"><CheckCircle className="w-3 h-3 mr-1" />Procesado</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = [
    { title: "Total Reembolsos", value: refunds.length.toString(), icon: DollarSign },
    { title: "Pendientes", value: refunds.filter((r: any) => r.estado === "pendiente").length.toString(), icon: Clock },
    { title: "Aprobados", value: refunds.filter((r: any) => r.estado === "aprobado").length.toString(), icon: CheckCircle },
    { title: "Monto Total", value: `$${refunds.reduce((sum: number, r: any) => sum + (r.monto || 0), 0).toLocaleString()}`, icon: DollarSign },
  ];

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Gestión de Reembolsos
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra las solicitudes de reembolso de tickets
          </p>
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

        {/* Refunds Table */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <CardTitle>Solicitudes de Reembolso</CardTitle>
                <CreateRefundDialog />
              </div>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar asistente (nombre, email)..."
                    value={searchAttendee}
                    onChange={(e) => setSearchAttendee(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar evento..."
                    value={searchEvent}
                    onChange={(e) => setSearchEvent(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asistente</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Solicitud</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Cargando reembolsos...
                    </TableCell>
                  </TableRow>
                ) : refunds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron reembolsos
                    </TableCell>
                  </TableRow>
                ) : (
                  refunds.map((refund: any) => (
                    <TableRow key={refund.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {refund.asistente?.nombre} {refund.asistente?.apellido}
                          </div>
                          <div className="text-sm text-muted-foreground">{refund.asistente?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{refund.evento?.nombre}</div>
                          <div className="text-sm text-muted-foreground">{refund.tipo_ticket?.tipo}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {refund.banco && (
                          <div>
                            <div className="font-medium">{refund.banco}</div>
                            <div className="text-sm text-muted-foreground">{refund.codigo_banco}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">${refund.monto?.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(refund.estado)}</TableCell>
                      <TableCell>{new Date(refund.fecha_solicitud).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Refund Dialog */}
        {selectedRefund && (
          <ViewRefundDialog
            isOpen={isViewDialogOpen}
            onClose={() => {
              setIsViewDialogOpen(false);
              setSelectedRefund(null);
            }}
            refund={selectedRefund}
          />
        )}

        {/* Edit Refund Dialog */}
        {selectedRefund && (
          <EditRefundDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedRefund(null);
            }}
            refund={selectedRefund}
          />
        )}
      </div>
    </Layout>
  );
};

export default Refunds;
