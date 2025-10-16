import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Clock, Award, CreditCard, User, Mail, Phone, CheckCircle } from "lucide-react";

const CourseCheckout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    formaPagoId: "",
    numeroCuotas: "1",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ["course-checkout", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select(`
          *,
          curso_profesores(
            profesores(*)
          ),
          curso_formas_pago(
            formas_pago(*)
          )
        `)
        .eq("id", id)
        .eq("estado", "activo")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const { data: enrollment, error: enrollError } = await supabase
        .from("estudiantes_cursos")
        .insert({
          curso_id: id,
          nombre_estudiante: formData.nombre,
          email_estudiante: formData.email,
          telefono_estudiante: formData.telefono,
          metodo_pago: formData.formaPagoId,
          estado: "activo",
        })
        .select()
        .single();

      if (enrollError) throw enrollError;

      // Si tiene cuotas, crear cuotas
      if (course?.permite_cuotas && parseInt(formData.numeroCuotas) > 1) {
        const numeroCuotas = parseInt(formData.numeroCuotas);
        const montoPorCuota = course.precio / numeroCuotas;
        const cuotas = [];

        for (let i = 1; i <= numeroCuotas; i++) {
          const fechaVencimiento = new Date();
          fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * (course.frecuencia_dias_cuotas || 30)));
          
          cuotas.push({
            estudiante_curso_id: enrollment.id,
            numero_cuota: i,
            monto: montoPorCuota,
            fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
            estado: i === 1 ? "pendiente" : "pendiente",
          });
        }

        const { error: cuotasError } = await supabase
          .from("cuotas_estudiantes")
          .insert(cuotas);

        if (cuotasError) throw cuotasError;
      }

      return enrollment;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "¡Inscripción exitosa!",
        description: "Te has inscrito correctamente al curso. Revisa tu email para más información.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al inscribirse",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (loadingCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Curso no encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">¡Inscripción Exitosa!</h2>
              <p className="text-muted-foreground text-lg">
                Te has inscrito correctamente al curso <span className="font-semibold text-foreground">{course.titulo}</span>
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-6 text-left space-y-2">
              <p className="text-sm">
                <strong>Email:</strong> {formData.email}
              </p>
              <p className="text-sm">
                <strong>Teléfono:</strong> {formData.telefono}
              </p>
              {course.permite_cuotas && parseInt(formData.numeroCuotas) > 1 && (
                <p className="text-sm">
                  <strong>Plan de pago:</strong> {formData.numeroCuotas} cuotas de ${(course.precio / parseInt(formData.numeroCuotas)).toFixed(2)}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Hemos enviado un correo de confirmación con los detalles de tu inscripción.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formasPago = course.curso_formas_pago?.map(cfp => cfp.formas_pago).filter(Boolean) || [];
  const profesores = course.curso_profesores?.map(cp => cp.profesores).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="relative">
        {course.imagen_portada_url ? (
          <div className="h-[400px] relative">
            <img 
              src={course.imagen_portada_url} 
              alt={course.titulo}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
        ) : (
          <div className="h-[400px] bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-32 h-32 text-primary/30" />
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <Badge variant="default" className="mb-2">{course.categoria || "Curso"}</Badge>
                </div>
                <CardTitle className="text-4xl font-bold mb-4">{course.titulo}</CardTitle>
                <p className="text-lg text-muted-foreground">{course.descripcion_corta}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-sm">{course.duracion_estimada_horas || 0} horas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="text-sm">Nivel: {course.nivel}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Descripción</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{course.descripcion}</p>
                </div>

                {course.lo_que_aprenderas && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Lo que aprenderás</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{course.lo_que_aprenderas}</p>
                  </div>
                )}

                {profesores.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Instructor{profesores.length > 1 ? 'es' : ''}</h3>
                    <div className="space-y-3">
                      {profesores.map((profesor) => (
                        <div key={profesor.id} className="flex items-start gap-3">
                          {profesor.foto_url ? (
                            <img src={profesor.foto_url} alt={profesor.nombre} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                              {profesor.nombre.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{profesor.nombre}</p>
                            {profesor.bio && <p className="text-sm text-muted-foreground">{profesor.bio}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-1">
            <Card className="border-none shadow-xl sticky top-6">
              <CardHeader>
                <CardTitle className="text-2xl">Inscríbete Ahora</CardTitle>
                <div className="pt-4">
                  <div className="text-4xl font-bold text-primary">${course.precio}</div>
                  {course.permite_cuotas && course.max_cuotas > 1 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      o hasta {course.max_cuotas} cuotas sin interés
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); enrollMutation.mutate(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">
                      <User className="w-4 h-4 inline mr-1" />
                      Nombre completo
                    </Label>
                    <Input
                      id="nombre"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Tu nombre"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Teléfono
                    </Label>
                    <Input
                      id="telefono"
                      type="tel"
                      required
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="+58 424 1234567"
                    />
                  </div>

                  {formasPago.length > 0 && (
                    <div className="space-y-2">
                      <Label>
                        <CreditCard className="w-4 h-4 inline mr-1" />
                        Forma de pago
                      </Label>
                      <RadioGroup 
                        value={formData.formaPagoId} 
                        onValueChange={(value) => setFormData({ ...formData, formaPagoId: value })}
                        required
                      >
                        {formasPago.map((fp) => (
                          <div key={fp.id} className="flex items-center space-x-2 border rounded-lg p-3">
                            <RadioGroupItem value={fp.id} id={fp.id} />
                            <Label htmlFor={fp.id} className="flex-1 cursor-pointer">
                              <div className="font-medium">{fp.nombre}</div>
                              {fp.descripcion && (
                                <div className="text-xs text-muted-foreground">{fp.descripcion}</div>
                              )}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {course.permite_cuotas && course.max_cuotas > 1 && (
                    <div className="space-y-2">
                      <Label htmlFor="cuotas">Número de cuotas</Label>
                      <Select 
                        value={formData.numeroCuotas}
                        onValueChange={(value) => setFormData({ ...formData, numeroCuotas: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: course.max_cuotas }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num === 1 ? "Pago único" : `${num} cuotas de $${(course.precio / num).toFixed(2)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? "Procesando..." : "Finalizar Inscripción"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Al inscribirte, aceptas nuestros términos y condiciones
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCheckout;
