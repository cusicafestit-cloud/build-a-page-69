import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DollarSign, Search, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const [filterStatus, setFilterStatus] = useState<string>("all");


  const { data: refunds = [], isLoading } = useQuery({
    queryKey: ["refunds"],
    queryFn: async () => {
      // Simulate empty data since reembolsos table is not in generated types
      // This will be updated when the table is properly configured
      return [];
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
    { title: "Pendientes", value: refunds.filter(r => r.status === "pending").length.toString(), icon: Clock },
    { title: "Aprobados", value: refunds.filter(r => r.status === "approved").length.toString(), icon: CheckCircle },
    { title: "Monto Total", value: `$${refunds.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}`, icon: DollarSign },
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
            <div className="flex justify-between items-center">
              <CardTitle>Solicitudes de Reembolso</CardTitle>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar reembolsos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asistente</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((refund) => (
                  <TableRow key={refund.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{refund.attendeeName}</div>
                        <div className="text-sm text-muted-foreground">{refund.attendeeEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{refund.event}</div>
                        <div className="text-sm text-muted-foreground">{refund.ticketType}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">${refund.amount}</TableCell>
                    <TableCell>{getStatusBadge(refund.status)}</TableCell>
                    <TableCell>{new Date(refund.requestDate).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-xs truncate">{refund.reason}</TableCell>
                    <TableCell>
                      {refund.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Aprobar</Button>
                          <Button size="sm" variant="outline">Rechazar</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Refunds;
