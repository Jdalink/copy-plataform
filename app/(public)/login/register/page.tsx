"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form"; // <-- Importar Controller
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, UserPlus, CalendarIcon, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/layouts/auth-layout";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const currentYear = new Date().getFullYear();
const oldestYear = 1930;

const registerSchema = z.object({
  nombre_completo: z.string().min(3, "El nombre completo es requerido."),
  email: z.string().email("Debe ser un email válido."),
  fecha_nacimiento: z.string({ required_error: "La fecha de nacimiento es requerida."})
    .refine((date) => date && !isNaN(new Date(date).getTime()), "Fecha inválida.")
    .refine((date) => date && new Date(date) < startOfToday(), { message: "La fecha no puede ser futura." }),
  sexo: z.enum(["Masculino", "Femenino"], { required_error: "El sexo es requerido." }),
  telefono: z.string().regex(/^\d{8}$/, "El teléfono debe tener 8 dígitos."),
  
  departamento: z.string().min(1, "El departamento es requerido."),
  municipio: z.string().min(1, "El municipio es requerido."),
  etnia: z.string().min(1, "La etnia es requerida."),
  comunidad_linguistica: z.string().min(1, "La comunidad es requerida."),
  asociacion_departamental: z.string().min(1, "La asociación es requerida."),

  isMinor: z.boolean().default(false),
  codigo_identificacion: z.string().optional(),
  direccion_residencia: z.string().optional(),
  nacionalidad: z.string().min(1, "Nacionalidad requerida."),
  
  peso_corporal: z.preprocess((a) => a === '' || a === null || a === undefined ? undefined : parseFloat(z.string().parse(a)), z.number().positive("El peso debe ser un número positivo.").optional()),
  altura_cm: z.preprocess((a) => a === '' || a === null || a === undefined ? undefined : parseInt(z.string().parse(a), 10), z.number().int().positive().max(300, "La altura no puede ser mayor a 300 cm.").optional()),
  
  foto_file: z.any()
    .refine((file) => !!file, "La foto de perfil es requerida.")
    .refine((file) => file?.size <= MAX_FILE_SIZE, `El archivo no debe exceder 5MB.`)
    .refine((file) => ALLOWED_IMAGE_TYPES.includes(file?.type), "Solo se aceptan formatos de imagen (jpg, png, webp)."),
  
  dpi_frente_file: z.any(),
  dpi_reverso_file: z.any(),

}).refine(data => {
    if (!data.isMinor) {
        return (!!data.codigo_identificacion && /^\d{13}$/.test(data.codigo_identificacion));
    }
    return true; 
}, {
    message: "Para mayores de edad, el CUI debe tener 13 dígitos.",
    path: ["codigo_identificacion"], 
}).refine(data => {
    if (!data.isMinor) {
        return !!data.dpi_frente_file;
    }
    return true;
}, {
    message: "La foto del DPI (frente) es obligatoria.",
    path: ["dpi_frente_file"],
}).refine(data => {
    if (!data.isMinor) {
        return !!data.dpi_reverso_file;
    }
    return true;
}, {
    message: "La foto del DPI (reverso) es obligatoria.",
    path: ["dpi_reverso_file"],
}).refine(data => {
    if (data.dpi_frente_file) {
        return data.dpi_frente_file?.size <= MAX_FILE_SIZE && ALLOWED_IMAGE_TYPES.includes(data.dpi_frente_file?.type);
    }
    return true;
}, {
    message: "El DPI (frente) debe ser una imagen (jpg, png) de menos de 5MB.",
    path: ["dpi_frente_file"],
}).refine(data => {
    if (data.dpi_reverso_file) {
        return data.dpi_reverso_file?.size <= MAX_FILE_SIZE && ALLOWED_IMAGE_TYPES.includes(data.dpi_reverso_file?.type);
    }
    return true;
}, {
    message: "El DPI (reverso) debe ser una imagen (jpg, png) de menos de 5MB.",
    path: ["dpi_reverso_file"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface SelectOption { id: number | string; nombre: string; }
interface MunicipioOption extends SelectOption { id_departamento: number; }

interface FormOptions {
  departamentos: SelectOption[];
  municipios: MunicipioOption[];
  etnias: SelectOption[];
  comunidadesLinguisticas: SelectOption[];
  asociaciones: SelectOption[];
}


function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formOptions, setFormOptions] = useState<FormOptions | null>(null);
  const [filteredMunicipios, setFilteredMunicipios] = useState<MunicipioOption[]>([]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      isMinor: false,
      codigo_identificacion: '',
      telefono: '',
      municipio: undefined,
      departamento: undefined,
      email: '',
      nombre_completo: '',
      fecha_nacimiento: '',
      sexo: undefined,
      direccion_residencia: '',
      asociacion_departamental: undefined,
      nacionalidad: 'Guatemalteco(a)', 
      etnia: undefined,
      comunidad_linguistica: undefined,
      peso_corporal: undefined,
      altura_cm: undefined,
      foto_file: undefined,
      dpi_frente_file: undefined,
      dpi_reverso_file: undefined,
    }
  });

  const departamentoValueFromForm = form.watch("departamento");
  const isMinor = form.watch("isMinor");

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch('/api/utils/form-options');
        if (!res.ok) throw new Error('No se pudieron cargar las opciones');
        
        // Validación de seguridad
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
           throw new Error("Error de conexión con el servidor.");
        }

        const data: FormOptions = await res.json();
        setFormOptions(data);
      } catch (error) {
        toast.error("Error al cargar opciones del formulario.");
        console.error(error);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (departamentoValueFromForm && formOptions) {
      const selectedDept = formOptions.departamentos.find(d => d.nombre === departamentoValueFromForm);
      if (selectedDept) {
        const filtered = formOptions.municipios.filter(m => m.id_departamento === selectedDept.id);
        setFilteredMunicipios(filtered);
      } else {
        setFilteredMunicipios([]);
      }
      form.resetField("municipio");
    } else {
      setFilteredMunicipios([]);
    }
  }, [departamentoValueFromForm, formOptions, form]);

  useEffect(() => {
    if (isMinor) {
        form.setValue("codigo_identificacion", "MENOR DE EDAD");
        form.clearErrors("codigo_identificacion");
    } else if (form.getValues("codigo_identificacion") === "MENOR DE EDAD") {
        form.setValue("codigo_identificacion", "");
    }
  }, [isMinor, form]);

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    const toastId = toast.loading("Registrando tu cuenta...");
    const formData = new FormData();

    let finalWeightKg = values.peso_corporal;
    if (weightUnit === 'lb' && finalWeightKg !== undefined) {
        finalWeightKg = finalWeightKg * 0.453592;
    }

    Object.entries(values).forEach(([key, value]) => {
        if (key === 'peso_corporal' && finalWeightKg !== undefined) {
            formData.append(key, finalWeightKg.toFixed(2));
        } 
        else if ((key === 'foto_file' || key === 'dpi_frente_file' || key === 'dpi_reverso_file') && value instanceof File) {
            formData.append(key, value);
        }
        else if (value !== undefined && value !== null && value !== '' && !(value instanceof File)) {
            formData.append(key, String(value));
        }
    });
    formData.append('activo', 'true');

    try {
      const response = await fetch('/api/register/athlete', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.message || 'Ocurrió un error desconocido.');

      toast.success('¡Registro completado exitosamente!', { id: toastId, duration: 5000 });
      setIsSuccess(true);

    } catch (error: any) {
      toast.error(error.message || "No se pudo completar el registro.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Registro Exitoso</CardTitle>
          <CardDescription>
            Los datos del atleta han sido registrados correctamente en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button onClick={() => window.location.reload()}>
            Registrar Nuevo Atleta
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl"> 
      <CardHeader className="text-center">
        <UserPlus className="mx-auto h-12 w-12 text-primary" />
        <CardTitle className="text-2xl mt-4">Registro de Nuevo Atleta</CardTitle>
        <CardDescription>Completa el formulario para solicitar tu cuenta. Los campos con * son obligatorios.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

                <FormField control={form.control} name="nombre_completo" render={({ field }) => ( <FormItem> <FormLabel>Nombre Completo *</FormLabel> <FormControl><Input placeholder="Nombre Apellido" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email *</FormLabel> <FormControl><Input type="email" placeholder="tu@correo.com" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                
                <FormField control={form.control} name="isMinor" render={({ field }) => ( <FormItem className="flex items-center space-x-2 pt-2 md:col-span-2"> <FormControl><Checkbox id="isMinorCheckFormPage" checked={field.value} onCheckedChange={field.onChange} /></FormControl><Label htmlFor="isMinorCheckFormPage" className="font-normal text-sm">Es menor de edad</Label> </FormItem>)}/>
                <FormField control={form.control} name="codigo_identificacion" render={({ field }) => ( <FormItem> <FormLabel>CUI (DPI) {isMinor ? '' : '*'}</FormLabel> <FormControl><Input placeholder="13 dígitos sin espacios" {...field} disabled={isMinor} maxLength={13} /></FormControl> <FormMessage /> </FormItem> )}/>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="fecha_nacimiento_button" className={cn(form.formState.errors.fecha_nacimiento && "text-destructive")}>Fecha de Nacimiento *</Label>
                  <Controller
                    name="fecha_nacimiento"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="fecha_nacimiento_button"
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                                fieldState.error && "border-destructive"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value + 'T00:00:00'), "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              value={field.value ? new Date(field.value + 'T00:00:00') : null}
                              onChange={(date) => field.onChange(date && !(date instanceof Array) ? format(date, 'yyyy-MM-dd') : '')}
                              maxDate={new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        {fieldState.error && <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p>}
                      </>
                    )}
                  />
                </div>
                
                <FormField control={form.control} name="sexo" render={({ field }) => ( <FormItem><FormLabel>Sexo *</FormLabel> <Select onValueChange={field.onChange} value={field.value || ""}> <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl> <SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Femenino">Femenino</SelectItem></SelectContent> </Select><FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="telefono" render={({ field }) => ( <FormItem> <FormLabel>Teléfono *</FormLabel> <FormControl><Input type="tel" placeholder="8 dígitos sin espacios" {...field} maxLength={8} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="nacionalidad" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Nacionalidad *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                          <SelectContent>
                              <SelectItem value="Guatemalteco(a)">Guatemalteco(a)</SelectItem>
                              <SelectItem value="Otro">Otro</SelectItem>
                          </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="direccion_residencia" render={({ field }) => ( <FormItem> <FormLabel>Dirección</FormLabel> <FormControl><Input placeholder="Dirección completa" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>

                <FormField control={form.control} name="departamento" render={({ field }) => (
                    <FormItem><FormLabel>Departamento *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''} >
                            <FormControl><SelectTrigger><SelectValue placeholder={formOptions ? "Selecciona..." : "Cargando..."}/></SelectTrigger></FormControl>
                            <SelectContent>{formOptions?.departamentos.map(d => <SelectItem key={d.id} value={d.nombre}>{d.nombre}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="municipio" render={({ field }) => (
                    <FormItem><FormLabel>Municipio *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={!departamentoValueFromForm}>
                            <FormControl><SelectTrigger><SelectValue placeholder={departamentoValueFromForm ? "Selecciona..." : "Elige un depto. primero"}/></SelectTrigger></FormControl>
                            <SelectContent>{filteredMunicipios.map((m) => <SelectItem key={m.id} value={m.nombre}>{m.nombre}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="etnia" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Etnia *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl><SelectTrigger><SelectValue placeholder={formOptions ? "Selecciona..." : "Cargando..."} /></SelectTrigger></FormControl>
                          <SelectContent>{formOptions?.etnias.map(e => <SelectItem key={e.id} value={e.nombre}>{e.nombre}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="comunidad_linguistica" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Comunidad Lingüística *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl><SelectTrigger><SelectValue placeholder={formOptions ? "Selecciona..." : "Cargando..."} /></SelectTrigger></FormControl>
                          <SelectContent>{formOptions?.comunidadesLinguisticas.map(c => <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="asociacion_departamental" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Asociación *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl><SelectTrigger><SelectValue placeholder={formOptions ? "Selecciona..." : "Cargando..."} /></SelectTrigger></FormControl>
                          <SelectContent>{formOptions?.asociaciones.map(a => <SelectItem key={a.id} value={a.nombre}>{a.nombre}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
                )}/>
                
                 <FormField control={form.control} name="peso_corporal" render={({ field }) => (
                   <FormItem>
                     <FormLabel className="flex items-center gap-1 text-sm"> Peso Corporal ({weightUnit}) <Switch checked={weightUnit === 'lb'} onCheckedChange={(c) => setWeightUnit(c ? 'lb' : 'kg')} className="scale-75" /> </FormLabel>
                     <FormControl><Input type="number" step="0.1" placeholder="Ej: 83.5" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)} value={field.value ?? ''}/></FormControl>
                     <FormMessage />
                   </FormItem>
                 )}/>
                 <FormField control={form.control} name="altura_cm" render={({ field }) => ( <FormItem> <FormLabel>Altura (cm)</FormLabel> <FormControl><Input type="number" placeholder="Ej: 175" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)} value={field.value ?? ''}/></FormControl> <FormMessage /> </FormItem> )}/>

                 <FormField control={form.control} name="foto_file" render={({ field: { value, onChange, ...fieldProps} }) => ( <FormItem> <FormLabel>Foto de Perfil * (Imagen)</FormLabel> <FormControl><Input type="file" accept="image/jpeg,image/png,image/webp" {...fieldProps} onChange={(e) => onChange(e.target.files?.[0])} /></FormControl> <FormMessage /> </FormItem> )}/>
                 
                 <FormField control={form.control} name="dpi_frente_file" render={({ field: { value, onChange, ...fieldProps} }) => ( <FormItem> <FormLabel>{isMinor ? 'Foto Acta de Nacimiento (Frente)' : 'Foto DPI (Frente) *'}</FormLabel> <FormControl><Input type="file" accept="image/jpeg,image/png,image/webp" {...fieldProps} onChange={(e) => onChange(e.target.files?.[0])} /></FormControl> <FormMessage /> </FormItem> )}/>
                 <FormField control={form.control} name="dpi_reverso_file" render={({ field: { value, onChange, ...fieldProps} }) => ( <FormItem> <FormLabel>{isMinor ? 'Foto Acta de Nacimiento (Reverso)' : 'Foto DPI (Reverso) *'}</FormLabel> <FormControl><Input type="file" accept="image/jpeg,image/png,image/webp" {...fieldProps} onChange={(e) => onChange(e.target.files?.[0])} /></FormControl> <FormMessage /> </FormItem> )}/>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Solicitud de Registro"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Wrapper component
export default function RegisterPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<Loader2 className="h-16 w-16 animate-spin" />}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
