"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MailQuestion } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Por favor, introduce un email válido."),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Solicitud enviada.");
      setIsSubmitted(true);
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <MailQuestion className="mx-auto h-12 w-12 text-primary" />
        <CardTitle className="text-2xl mt-4">Recuperar Contraseña</CardTitle>
        <CardDescription>
          {isSubmitted 
            ? "Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña."
            : "Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña."}
        </CardDescription>
      </CardHeader>
      {!isSubmitted && (
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="tu@correo.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Enlace de Recuperación"}</Button>
            </form>
          </Form>
        </CardContent>
      )}
      <div className="p-6 pt-0 text-center text-sm"><Link href="/login" className="font-medium text-primary hover:underline">Volver a Iniciar Sesión</Link></div>
    </Card>
  );
}