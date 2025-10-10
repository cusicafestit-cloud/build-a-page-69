import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Music, Repeat, CheckCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const PublicExchange = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [exchangeData, setExchangeData] = useState({
    email: "",
    ticketCode: "",
    originalEvent: "",
    targetEvent: "",
    reason: ""
  });

  const events = [
    { id: "festival-rock", name: "Festival de Rock 2025", date: "15 Mar 2025" },
    { id: "jazz-night", name: "Concierto Jazz Night", date: "20 Abr 2025" },
    { id: "reggaeton-fest", name: "Reggaeton Fest", date: "5 Nov 2025" }
  ];

  const handleSubmitExchange = () => {
    toast({
      title: "¡Solicitud enviada!",
      description: "Tu solicitud de canje ha sido recibida. Te contactaremos pronto.",
    });
    setStep(3);
  };

  const handleNextStep = () => {
    if (step === 1 && exchangeData.email && exchangeData.ticketCode) {
      setStep(2);
    } else if (step === 2 && exchangeData.originalEvent && exchangeData.targetEvent) {
      handleSubmitExchange();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Music className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Cusica
            </h1>
          </div>
          <h2 className="text-2xl font-bold mb-2">Canje Público de Tickets</h2>
          <p className="text-muted-foreground">
            Intercambia tu ticket por otro evento de forma fácil y segura
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Ticket Verification */}
        {step === 1 && (
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="w-5 h-5" />
                Verificación de Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email de Registro</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={exchangeData.email}
                  onChange={(e) => setExchangeData({ ...exchangeData, email: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Ingresa el email con el que compraste tu ticket
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-code">Código de Ticket</Label>
                <Input
                  id="ticket-code"
                  placeholder="CUS-2025-XXXX"
                  value={exchangeData.ticketCode}
                  onChange={(e) => setExchangeData({ ...exchangeData, ticketCode: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Encuentra este código en tu email de confirmación
                </p>
              </div>
              <Button 
                onClick={handleNextStep}
                disabled={!exchangeData.email || !exchangeData.ticketCode}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                Verificar Ticket
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Exchange Selection */}
        {step === 2 && (
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="w-5 h-5" />
                Seleccionar Canje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Evento Actual</Label>
                  <Select onValueChange={(value) => setExchangeData({ ...exchangeData, originalEvent: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu evento actual" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          <div>
                            <div className="font-medium">{event.name}</div>
                            <div className="text-sm text-muted-foreground">{event.date}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Evento Deseado</Label>
                  <Select onValueChange={(value) => setExchangeData({ ...exchangeData, targetEvent: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el evento deseado" />
                    </SelectTrigger>
                    <SelectContent>
                      {events
                        .filter(event => event.id !== exchangeData.originalEvent)
                        .map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          <div>
                            <div className="font-medium">{event.name}</div>
                            <div className="text-sm text-muted-foreground">{event.date}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo del Canje (Opcional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Cuéntanos por qué quieres hacer este canje..."
                  value={exchangeData.reason}
                  onChange={(e) => setExchangeData({ ...exchangeData, reason: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Atrás
                </Button>
                <Button 
                  onClick={handleNextStep}
                  disabled={!exchangeData.originalEvent || !exchangeData.targetEvent}
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  Solicitar Canje
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <Card className="border-none shadow-xl">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-2xl font-bold mb-4">¡Solicitud Enviada!</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Hemos recibido tu solicitud de canje. Nuestro equipo la revisará y te contactaremos 
                en las próximas 24-48 horas para confirmar la disponibilidad.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground mb-8">
                <p><strong>Email:</strong> {exchangeData.email}</p>
                <p><strong>Código de Ticket:</strong> {exchangeData.ticketCode}</p>
                <p><strong>Canje solicitado:</strong> {
                  events.find(e => e.id === exchangeData.originalEvent)?.name
                } → {
                  events.find(e => e.id === exchangeData.targetEvent)?.name
                }</p>
              </div>
              <Button 
                onClick={() => {
                  setStep(1);
                  setExchangeData({
                    email: "",
                    ticketCode: "",
                    originalEvent: "",
                    targetEvent: "",
                    reason: ""
                  });
                }}
                variant="outline"
              >
                Hacer Otro Canje
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>¿Necesitas ayuda? <a href="https://wa.me/584122097456" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Contáctanos por WhatsApp</a></p>
        </div>
      </div>
    </div>
  );
};

export default PublicExchange;
