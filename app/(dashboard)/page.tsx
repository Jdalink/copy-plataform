"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Loader2 } from "lucide-react";

// Importa los dashboards que has creado
import AdminDashboard from "@/components/dashboards/admin-dashboard";
import { EntrenadorDashboard } from "@/components/dashboards/entrenador-dashboard";
import AtletaDashboard from "@/components/dashboards/atleta-dashboard";

/**
 * Esta es la página de inicio después del login.
 * Actúa como un enrutador del lado del cliente para mostrar el dashboard
 * correcto según el rol del usuario almacenado en la sesión.
 */
export default function DashboardPage() {
  const { data: session, status } = useSession();

  // Muestra un indicador de carga mientras se obtiene la sesión
  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Si no hay sesión o rol, muestra un mensaje de error o redirige
  if (status === "unauthenticated" || !session?.user?.role) {
    // Esto no debería pasar si el middleware funciona, pero es una buena práctica tenerlo.
    // Si ocurre, cierra la sesión y redirige al login.
    useEffect(() => {
      signOut({ callbackUrl: '/login?error=No+autenticado' });
    }, []);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="ml-4">Redirigiendo al inicio de sesión...</p>
        </div>
    );
  }

  // Renderiza el dashboard correspondiente según el rol
  const userRole = session.user.role.toLowerCase();

  switch (userRole) {
    case "administrador":
      return <AdminDashboard />;
    case "entrenador":
      return <EntrenadorDashboard />;
    case "atleta":
      return <AtletaDashboard />;
    default:
      // --- INICIO DE LA CORRECCIÓN ---
      // Si el rol no es válido, cierra la sesión y redirige al login con un error.
      useEffect(() => {
        signOut({ callbackUrl: '/login?error=Rol+de+usuario+no+válido+o+sin+permisos.' });
      }, []);

      return (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="ml-4">Rol no válido. Cerrando sesión...</p>
        </div>
      );
      // --- FIN DE LA CORRECCIÓN ---
  }
}