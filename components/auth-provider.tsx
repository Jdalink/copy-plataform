"use client"

import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"

// Este componente ahora es solo un "wrapper" para el SessionProvider de NextAuth.
// Toda la lógica de login y sesión la gestiona NextAuth.
export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
