"use client"

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api-config";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";

interface SolicitudInscripcion {
    id: string;
    atleta_nombre: string;
    competencia_nombre: string;
    estado: 'pendiente' | 'aprobada' | 'rechazada';
}

export default function SolicitudesPage() {
    const [solicitudes, setSolicitudes] = useState<SolicitudInscripcion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { data: session } = useSession();

    const fetchSolicitudes = useCallback(async () => {
        if (!session || session.user.role !== 'Entrenador') return;
        setIsLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.COMPETENCIAS.LISTAR_SOLICITUDES_PENDIENTES);
            if (!response.ok) throw new Error("Error al cargar las solicitudes");
            const data = await response.json();
            setSolicitudes(data);
        } catch (error) {
            toast({ title: "Error de Carga", description: "No se pudieron cargar los datos.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast, session]);

    useEffect(() => {
        fetchSolicitudes();
    }, [fetchSolicitudes]);

    const handleUpdateSolicitud = async (id: string, estado: 'aprobada' | 'rechazada') => {
        try {
            const response = await fetch(API_ENDPOINTS.COMPETENCIAS.ACTUALIZAR_ESTADO_INSCRIPCION(id), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al actualizar la solicitud");
            }
            toast({ title: `Solicitud ${estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}` });
            fetchSolicitudes();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Solicitudes de Inscripción</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Inscripciones Pendientes de Aprobación</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Atleta</TableHead>
                                <TableHead>Competencia</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {solicitudes.length > 0 ? solicitudes.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell>{s.atleta_nombre}</TableCell>
                                    <TableCell>{s.competencia_nombre}</TableCell>
                                    <TableCell><Badge>{s.estado}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        {s.estado === 'pendiente' && (
                                            <>
                                                <Button variant="ghost" size="icon" onClick={() => handleUpdateSolicitud(s.id, 'aprobada')}><Check className="h-4 w-4 text-green-500" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleUpdateSolicitud(s.id, 'rechazada')}><X className="h-4 w-4 text-red-500" /></Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">No hay solicitudes pendientes.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
