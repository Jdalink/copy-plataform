"use client";

import { Suspense } from "react";
import dynamic from 'next/dynamic';
import { Loader2 } from "lucide-react";

// --- INICIO CORRECCIÓN BUILD: Importación dinámica ---
// Forzamos que el LoginForm solo se renderice en el cliente para evitar
// el error de 'useSearchParams()' durante el build estático.
const LoginForm = dynamic(() => import('@/components/auth/login-form'), {
  ssr: false,
  loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary" />,
});
// --- FIN CORRECCIÓN BUILD ---


export default function LoginPage() {
  return (
    <Suspense fallback={<Loader2 className="h-16 w-16 animate-spin text-primary" />}>
      <LoginForm />
    </Suspense>
  );
}
