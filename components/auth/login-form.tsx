"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Por favor, introduce un email válido."),
  password: z.string().min(1, "La contraseña es requerida."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);

    try {
      const callbackUrl = searchParams.get("callbackUrl") || "/";
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (res?.error) {
        throw new Error(res.error === "CredentialsSignin" ? "Credenciales incorrectas." : res.error);
      }

      toast.success("Inicio de sesión exitoso.");
      router.push(callbackUrl);

    } catch (error: any) {
      toast.error("Error al iniciar sesión", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Image
            src="/icons/android-chrome-512x512.png"
            alt="Logo Federación de Potencia"
            width={80}
            height={80}
            priority
          />
        </div>
        <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
        <CardDescription>Bienvenido de nuevo. Ingresa tus credenciales.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" placeholder="tu@correo.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="•••••••••••••" {...field} />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-right text-sm">
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>
        <div className="mt-6 text-center text-sm">
          ¿No tienes una cuenta?{" "}
          <Link href="/login/register" className="font-medium text-primary hover:underline">Regístrate aquí</Link>
        </div>
      </CardContent>
    </Card>
  );
}
