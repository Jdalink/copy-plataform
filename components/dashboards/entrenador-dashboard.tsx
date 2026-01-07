"use client"

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Trophy, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { API_ENDPOINTS } from "@/lib/api-config";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AtletaAsignadoSimple {
  atleta_id: string;
  nombre_completo: string;
  activo: boolean;
}

interface InscripcionPendiente {
  id: string;
  atleta_nombre: string;
  competencia_nombre: string;
  competencia_fecha: string;
}

export function EntrenadorDashboard() {
  const { data: session } = useSession();
  const [atletasAsignados, setAtletasAsignados] = useState<AtletaAsignadoSimple[]>([]);
  const [inscripcionesPendientes, setInscripcionesPendientes] = useState<InscripcionPendiente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingInscription, setIsProcessingInscription] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [atletasRes, inscripcionesRes] = await Promise.all([
        fetch(API_ENDPOINTS.ENTRENADORES.GET_MY_ATLETAS),
        fetch(API_ENDPOINTS.COMPETENCIAS.INSCRIPCIONES_PENDIENTES)
      ]);

      if (atletasRes.ok) {
        const data = await atletasRes.json();
        setAtletasAsignados(Array.isArray(data) ? data : []);
      } else {
        setAtletasAsignados([]);
      }

      if (inscripcionesRes.ok) {
         const data = await inscripcionesRes.json();
         setInscripcionesPendientes(Array.isArray(data) ? data : []);
      } else {
         setInscripcionesPendientes([]);
      }

    } catch (error) {
      setAtletasAsignados([]);
      setInscripcionesPendientes([]);
      toast.error("Error al cargar los datos del panel.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchData();
    } else {
        setIsLoading(false);
    }
  }, [session, fetchData]);

  const handleInscriptionAction = async (inscripcionId: string, action: 'approve' | 'reject') => {
      setIsProcessingInscription(inscripcionId);
      const url = action === 'approve'
          ? API_ENDPOINTS.COMPETENCIAS.APPROVE_INSCRIPCION(inscripcionId)
          : API_ENDPOINTS.COMPETENCIAS.REJECT_INSCRIPCION(inscripcionId);
      try {
          const response = await fetch(url, { method: 'POST' });
          if (!response.ok) {
               const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.message || `Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} inscripción.`);
          }
          toast.success(`Inscripción ${action === 'approve' ? 'aprobada' : 'rechazada'}.`);
          fetchData();
      } catch (error: any) {
          toast.error(error.message);
      } finally {
          setIsProcessingInscription(null);
      }
  };

  const atletasActivos = atletasAsignados.filter(a => a.activo).length;

  return (
    <div className="space-y-6">
       <h2 className="text-3xl font-bold tracking-tight">Panel de Entrenador</h2>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Atletas Asignados</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{atletasAsignados.length}</div>}
                    <p className="text-xs text-muted-foreground">Total bajo tu supervisión.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Atletas Activos</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{atletasActivos}</div>}
                    <p className="text-xs text-muted-foreground">Atletas actualmente activos.</p>
                </CardContent>
            </Card>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Mis Atletas</CardTitle>
              <CardDescription>Lista de todos tus atletas asignados.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : atletasAsignados.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atletasAsignados.map((atleta) => (
                      <TableRow key={atleta.atleta_id}>
                        <TableCell className="font-medium">{atleta.nombre_completo}</TableCell>
                        <TableCell>
                          <Badge variant={atleta.activo ? "default" : "destructive"}>
                            {atleta.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/atletas/${atleta.atleta_id}`}>Ver Perfil</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground p-4">No tienes atletas asignados.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Inscripciones Pendientes</CardTitle>
                <CardDescription>Revisa las solicitudes de inscripción a competencias.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div>
                ) : inscripcionesPendientes.length > 0 ? (
                    <ul className="space-y-3">
                        {inscripcionesPendientes.map(inscripcion => (
                            <li key={inscripcion.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-md gap-2">
                                <div>
                                    <p className="font-medium">{inscripcion.atleta_nombre}</p>
                                    <p className="text-sm text-muted-foreground">{inscripcion.competencia_nombre} ({new Date(inscripcion.competencia_fecha).toLocaleDateString('es-GT')})</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                     <Button
                                        size="sm" variant="outline"
                                        className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:text-red-500 dark:border-red-500 dark:hover:text-red-400"
                                        onClick={() => handleInscriptionAction(inscripcion.id, 'reject')}
                                        disabled={isProcessingInscription === inscripcion.id}
                                    >
                                        {isProcessingInscription === inscripcion.id ? <Loader2 className="h-4 w-4 animate-spin"/> : "Rechazar"}
                                    </Button>
                                    <Button
                                        size="sm" variant="default"
                                         onClick={() => handleInscriptionAction(inscripcion.id, 'approve')}
                                         disabled={isProcessingInscription === inscripcion.id}
                                    >
                                         {isProcessingInscription === inscripcion.id ? <Loader2 className="h-4 w-4 animate-spin"/> : "Aprobar"}
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-muted-foreground p-4">No hay inscripciones pendientes.</p>
                )}
            </CardContent>
          </Card>
       </div>
    </div>
  );
}
