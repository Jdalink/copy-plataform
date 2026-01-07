"use client"

import { useState, useEffect, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos en milisegundos
const WARNING_TIME = 30 * 1000; // 30 segundos de advertencia

export function InactivityTimeoutProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_TIME / 1000);
  const router = useRouter();

  const logout = useCallback(() => {
    signOut({ redirect: false }).then(() => router.push('/login?reason=inactivity'));
    setShowWarning(false); // <-- CORRECCIÓN: Ocultar el diálogo al cerrar sesión.
  }, [router]);

  const resetTimer = useCallback(() => {
    clearTimeout((window as any).inactivityTimer);
    (window as any).inactivityTimer = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVITY_TIMEOUT - WARNING_TIME);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    const eventHandler = () => resetTimer();

    events.forEach(event => window.addEventListener(event, eventHandler));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, eventHandler));
      clearTimeout((window as any).inactivityTimer);
    };
  }, [status, resetTimer]);

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    if (showWarning) {
      setCountdown(WARNING_TIME / 1000);
      countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownInterval);
  }, [showWarning, logout]);

  const handleStay = () => {
    setShowWarning(false);
    resetTimer();
  };

  return (
    <>
      {children}
      <AlertDialog open={showWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Sigues ahí?</AlertDialogTitle>
            <AlertDialogDescription>
              Tu sesión está a punto de expirar por inactividad. Serás desconectado en {countdown} segundos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={logout}>Cerrar Sesión</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleStay}>Permanecer Conectado</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}