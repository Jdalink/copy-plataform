"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, User, Settings, LogOut, Sun, Moon } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { API_ENDPOINTS } from "@/lib/api-config"
import { useEffect, useState } from "react"

interface Notificacion {
    id: string;
    mensaje: string;
    leido: boolean;
    created_at: string;
}

// Función auxiliar movida fuera para claridad
const getAvatarUrl = (imagePath?: string | null): string | undefined => {
    if (!imagePath) return undefined;

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    
    // --- CORRECCIÓN: Limpiar la ruta de forma más robusta ---
    // Elimina cualquier '/uploads/' o 'uploads/' al inicio de la ruta.
    const cleanedPath = imagePath.replace(/^\/?uploads\//, '');
    
    // Fallback: Si la ruta ya viene limpia (ej. 'avatars/foto.jpg'), añádele el prefijo
    // Evita añadir doble barra si imagePath empieza con '/' (aunque no debería)
    return `/api/media/${cleanedPath}`;
}

export function Header() {
  const { data: session, status } = useSession();
  const { setTheme, theme } = useTheme();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetch(API_ENDPOINTS.NOTIFICACIONES.LIST)
        .then(res => res.ok ? res.json() : Promise.reject('Error fetching notifications'))
        .then(data => {
          if (Array.isArray(data)) {
            setNotificaciones(data);
            setHasUnread(data.some((n: Notificacion) => !n.leido));
          } else {
            setNotificaciones([]);
            setHasUnread(false);
          }
        })
        .catch(error => {
          console.error("Failed to load notifications:", error);
          setNotificaciones([]);
          setHasUnread(false);
        });
    }
  }, [status]);
  
  const handleMarkAsRead = async () => {
    if (!hasUnread) return;
    try {
      const res = await fetch(API_ENDPOINTS.NOTIFICACIONES.MARK_AS_READ, { method: 'POST' });
      if (res.ok) {
        setNotificaciones(notificaciones.map(n => ({ ...n, leido: true })));
        setHasUnread(false);
      }
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };
  
  const getInitials = (fullName?: string | null, name?: string | null): string => {
    const targetName = fullName || name;
    if (!targetName) return '??';
    const parts = targetName.trim().split(' ');
    if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
 }

  // Usamos la función auxiliar corregida
  const avatarUrl = getAvatarUrl(session?.user?.image);

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6 shrink-0">
      <SidebarTrigger />
      <div className="flex-1"></div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu onOpenChange={(open) => { if (open) handleMarkAsRead(); }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {hasUnread && <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notificaciones.length > 0 ? (
                notificaciones.slice(0, 5).map(n => ( // Mostrar solo las últimas 5
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 whitespace-normal">
                        <p className={`text-sm ${!n.leido ? 'font-semibold' : ''}`}>{n.mensaje}</p>
                        <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                    </DropdownMenuItem>
                ))
            ) : (
                <DropdownMenuItem>No tienes notificaciones</DropdownMenuItem>
            )}
            {notificaciones.length > 5 && (
                 <DropdownMenuItem disabled>...</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                {/* Usamos la URL corregida */}
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>{getInitials(session?.user?.fullName, session?.user?.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.fullName || session?.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/perfil"><User className="mr-2 h-4 w-4" /><span>Mi Perfil</span></Link></DropdownMenuItem>
            {session?.user?.role === 'Administrador' && (<DropdownMenuItem asChild><Link href="/configuracion"><Settings className="mr-2 h-4 w-4" /><span>Configuración</span></Link></DropdownMenuItem>)}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500 focus:text-red-600 focus:bg-red-50/50" onClick={() => signOut({ callbackUrl: '/login' })}><LogOut className="mr-2 h-4 w-4" /><span>Cerrar Sesión</span></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}