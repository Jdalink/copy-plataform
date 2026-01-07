"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  code: z.string().min(6, { message: "El código debe tener 6 dígitos." }).max(6),
});

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [isResending, setIsResending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!email) {
        toast.error("Email no encontrado. Por favor, intenta iniciar sesión de nuevo.");
        router.push('/login');
        return;
    }
    
    const toastId = toast.loading("Verificando código...");
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email,
        password: "", // La contraseña no es necesaria en el paso de 2FA
        twoFactorCode: values.code,
      });

      if (result?.error) {
        // Ignorar el error específico de 2FA que ya se manejó, mostrar otros
        if (!result.error.startsWith('2FA_REQUIRED:')) {
          throw new Error(result.error);
        }
      }
      
      toast.success("¡Inicio de sesión exitoso!", { id: toastId });
      router.refresh();
      router.push('/');

    } catch (error: any) {
      toast.error(error.message || "Ocurrió un error.", { id: toastId });
    }
  };

  // --- INICIO DE LA CORRECCIÓN: Función para reenviar el código ---
  const handleResendCode = async () => {
    if (!email) {
      toast.error("Email no encontrado.");
      return;
    }
    setIsResending(true);
    const toastId = toast.loading("Reenviando código...");
    try {
      // Se simula un re-login sin contraseña para volver a activar el envío del código 2FA
      const result = await signIn('credentials', {
        redirect: false,
        email: email,
        password: "resend-2fa-trigger", // Un valor ficticio para pasar la validación inicial
      });

      // El flujo normal es que `signIn` devuelva un error '2FA_REQUIRED', lo cual es un éxito en este caso.
      if (result?.error && result.error.startsWith('2FA_REQUIRED:')) {
        toast.success("Se ha enviado un nuevo código a tu email.", { id: toastId });
      } else if (result?.error) {
        throw new Error(result.error);
      }
    } catch (error: any) {
       toast.error(error.message || "No se pudo reenviar el código.", { id: toastId });
    } finally {
      setIsResending(false);
    }
  };
  // --- FIN DE LA CORRECCIÓN ---

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Verificación de Dos Pasos</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Hemos enviado un código de 6 dígitos a tu email ({email}).
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Verificación</FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      placeholder="123456" 
                      {...field}
                      maxLength={6}
                      disabled={form.formState.isSubmitting || isResending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={!email || form.formState.isSubmitting || isResending}>
              {form.formState.isSubmitting ? "Verificando..." : "Verificar e Iniciar Sesión"}
            </Button>
          </form>
        </Form>
        {/* --- INICIO DE LA CORRECCIÓN: Opciones adicionales --- */}
        <div className="text-center text-sm text-muted-foreground">
            <Button variant="link" onClick={handleResendCode} disabled={isResending}>
                {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                ¿No recibiste el código? Reenviar
            </Button>
            <span className="mx-2">|</span>
             <Button variant="link" asChild>
                <Link href="/login">Volver a Iniciar Sesión</Link>
            </Button>
        </div>
        {/* --- FIN DE LA CORRECCIÓN --- */}
      </div>
    </div>
  );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <VerifyForm />
        </Suspense>
    )
}