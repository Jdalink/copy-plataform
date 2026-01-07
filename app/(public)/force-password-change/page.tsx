"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, KeyRound, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

const passwordSchema = z.object({
  newPassword: z.string()
    .min(13, "La contraseña debe tener al menos 13 caracteres.")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula.")
    .regex(/[a-z]/, "Debe contener al menos una minúscula.")
    .regex(/[0-9]/, "Debe contener al menos un número.")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Debe contener al menos un carácter especial."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

function PasswordStrength({ password }: { password?: string }) {
  const checks = [
    { label: "Al menos 13 caracteres", regex: /.{13,}/ },
    { label: "Al menos una mayúscula (A-Z)", regex: /[A-Z]/ },
    { label: "Al menos una minúscula (a-z)", regex: /[a-z]/ },
    { label: "Al menos un número (0-9)", regex: /[0-9]/ },
    { label: "Al menos un carácter especial", regex: /[!@#$%^&*(),.?":{}|<>]/ },
  ];

  return (
    <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
      <h4 className="text-sm font-semibold mb-2">Requisitos de la contraseña:</h4>
      {checks.map((check, index) => {
        const isValid = password ? check.regex.test(password) : false;
        return (
          <div key={index} className={`flex items-center text-sm ${isValid ? "text-green-600" : "text-muted-foreground"}`}>
            {isValid ? <CheckCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
            {check.label}
          </div>
        );
      })}
    </div>
  );
}

export default function ForcePasswordChangePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onTouched",
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: PasswordFormValues) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/force-password-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: values.newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Contraseña actualizada exitosamente.", { 
        description: "Serás redirigido al login para iniciar sesión con tu nueva contraseña.",
        duration: 5000,
      });
      await signOut({ redirect: true, callbackUrl: '/login' });
    } catch (error: any) {
      toast.error("Error al cambiar la contraseña", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <KeyRound className="mx-auto h-12 w-12 text-primary" />
        <CardTitle className="text-2xl mt-4">Cambio de Contraseña Obligatorio</CardTitle>
        <CardDescription>Por seguridad, debes establecer una nueva contraseña para continuar.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="•••••••••••••" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setPassword(e.target.value);
                        }}
                      />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <PasswordStrength password={password} />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                  <FormControl><Input type={showPassword ? "text" : "password"} placeholder="•••••••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Establecer Nueva Contraseña"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}