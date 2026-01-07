"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar"
import {
  Home, Users, Trophy, Dumbbell, UserCheck, BarChart2,
  Brain, Utensils, Settings, Shield, Target, LucideIcon,
} from "lucide-react"
import Image from "next/image"
import { useConfig } from "@/components/config-provider"

// --- INICIO DE LA CORRECCIÓN: Definir un tipo para los items del menú ---
type MenuItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};
// --- FIN DE LA CORRECCIÓN ---

const allMenuItems: MenuGroup[] = [
  { title: "Principal", items: [{ title: "Dashboard", url: "/", icon: Home }] },
  { title: "Gestión", items: [
      { title: "Atletas", url: "/atletas", icon: Users },
      { title: "Entrenadores", url: "/entrenadores", icon: UserCheck },
      { title: "Seguimiento", url: "/entrenamientos", icon: Dumbbell },
      { title: "Competencias", url: "/competencias", icon: Trophy },
      { title: "Resultados", url: "/resultados", icon: Target },
  ]},
  { title: "Análisis", items: [
      { title: "Rendimiento", url: "/rendimiento", icon: BarChart2 },
      { title: "Rankings", url: "/rankings", icon: Trophy },
      // { title: "Reportes", url: "/reportes", icon: BarChart2 }, // Ocultado temporalmente
  ]},
  { title: "Planes Inteligentes", items: [
      { title: "Planes de Entrenamiento", url: "/planes-entrenamiento", icon: Brain },
      { title: "Planes de Alimentación", url: "/planes-alimentacion", icon: Utensils },
  ]},
  { title: "Sistema", items: [
      { title: "Usuarios", url: "/usuarios", icon: Shield },
      { title: "Configuración", url: "/configuracion", icon: Settings },
  ]},
]

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { getSetting, loading } = useConfig();
  const federacionNombre = getSetting('federacion_nombre') || 'PowerFed';
  const logoUrl = getSetting('logo_main_url');

  const finalLogoUrl = logoUrl;

  const menuItems = allMenuItems.map(group => {
    // --- INICIO DE LA CORRECCIÓN: Tipado explícito para filteredItems ---
    let filteredItems: MenuItem[];
    // --- FIN DE LA CORRECCIÓN ---
    const userRole = session?.user?.role;

    if (userRole === 'Administrador' || userRole === 'Gerencia') {
      filteredItems = group.items;
    } else if (userRole === 'Atleta') {
      const allowedUrls = ['/', '/rankings', '/resultados', '/competencias', '/rendimiento'];
      filteredItems = group.items.filter(item => allowedUrls.includes(item.url));
    } else if (userRole === 'Entrenador') {
      const disallowedUrls = ['/entrenadores', '/reportes', '/usuarios', '/configuracion'];
      filteredItems = group.items.filter(item => !disallowedUrls.includes(item.url));
    } else {
      filteredItems = [];
    }
    
    if (filteredItems.length === 0) return null;
    return { ...group, items: filteredItems };
  }).filter(Boolean);

  return (
    // --- INICIO DE LA CORRECCIÓN ---
    // El <Sidebar> wrapper se movió a (dashboard)/layout.tsx. Este componente ahora solo renderiza el contenido.
    <>
      <SidebarContent>
        {menuItems.map(group => group && (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-muted-foreground">© 2024 {federacionNombre}</div>
      </SidebarFooter>
      <SidebarRail />
    </>
    // --- FIN DE LA CORRECCIÓN ---
  )
}
