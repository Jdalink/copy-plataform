"use client"

import { useState, useEffect, useCallback } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from "@/components/ui/button";
import { Loader2, Users, Dumbbell, CalendarClock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton"

// --- Interfaces para los datos del dashboard ---
interface DashboardStats {
  totalEntrenadores: number;
  totalAtletas: number;
}

interface ProximaCompetencia {
  id: string;
  nombre: string;
  fecha: string;
  ubicacion: string;
}

interface AtletasPorCategoria {
  categoria_peso: string;
  femenino: number;
  masculino: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [competencias, setCompetencias] = useState<ProximaCompetencia[]>([]);
  const [atletasPorCategoria, setAtletasPorCategoria] = useState<AtletasPorCategoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      toast.info("Actualizando datos...");
    }
    setIsLoading(true);
    try {
      const [statsRes, competenciasRes, atletasCategoriaRes] = await Promise.all([
        fetch('/api/dashboard/admin/stats'),
        fetch('/api/dashboard/admin/proximas-competencias'),
        fetch('/api/dashboard/admin/atletas-por-categoria')
      ]);

      if (!statsRes.ok || !competenciasRes.ok || !atletasCategoriaRes.ok) {
        throw new Error('No se pudieron cargar todos los datos del dashboard.');
      }

      const statsData = await statsRes.json();
      const competenciasData = await competenciasRes.json();
      const atletasCategoriaData = await atletasCategoriaRes.json();

      setStats(statsData);
      setCompetencias(competenciasData);
      setAtletasPorCategoria(atletasCategoriaData);

    } catch (error: any) {
      toast.error("Error al cargar el dashboard", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard del Administrador</h2>
        <Button onClick={() => fetchData(true)} size="sm" variant="outline" disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>
      
      {/* Tarjetas de Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Atletas</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAtletas ?? 0}</div>
            <p className="text-xs text-muted-foreground">Atletas registrados en el sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entrenadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEntrenadores ?? 0}</div>
            <p className="text-xs text-muted-foreground">Entrenadores activos e inactivos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Gráfica de Atletas por Categoría */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Atletas por Categoría de Peso</CardTitle>
            <CardDescription>Distribución de atletas masculinos y femeninos por categoría.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={atletasPorCategoria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria_peso" angle={-45} textAnchor="end" height={60} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="masculino" name="Masculino" fill="#3b82f6" />
                <Bar dataKey="femenino" name="Femenino" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Próximas Competencias */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Próximas Competencias</CardTitle>
            <CardDescription>Eventos programados que están por ocurrir.</CardDescription>
          </CardHeader>
          <CardContent>
            {competencias.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competencia</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competencias.map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell>
                        <div className="font-medium">{comp.nombre}</div>
                        <div className="text-sm text-muted-foreground">{comp.ubicacion}</div>
                      </TableCell>
                      <TableCell>{new Date(comp.fecha).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <CalendarClock className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No hay competencias programadas próximamente.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
