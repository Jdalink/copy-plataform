"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { API_ENDPOINTS } from '@/lib/api-config';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// --- INTERFACES ---
interface AtletaSimple {
  id: string;
  nombre_completo: string;
}

interface RegistroRendimiento {
  id: string;
  fecha: string;
  sentadilla: number | null;
  press_banca: number | null;
  peso_muerto: number | null;
  total: number;
  tipo_registro: 'entrenamiento' | 'competencia';
}

// --- COMPONENTE PRINCIPAL ---
export default function RendimientoPage() {
  const { data: session } = useSession();
  const [atletas, setAtletas] = useState<AtletaSimple[]>([]);
  const [selectedAtletaId, setSelectedAtletaId] = useState<string>('');
  const [rendimiento, setRendimiento] = useState<RegistroRendimiento[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Determinar el atleta a cargar: el propio atleta o el seleccionado por admin/entrenador
  const targetAtletaId = useMemo(() => {
    if (session?.user.role === 'Atleta') {
      return session.user.atleta_id;
    }
    return selectedAtletaId;
  }, [session, selectedAtletaId]);

  // Cargar lista de atletas si el usuario es admin o entrenador
  useEffect(() => {
    if (['Administrador', 'Entrenador'].includes(session?.user.role || '')) {
      const fetchAtletas = async () => {
        try {
          const res = await fetch(API_ENDPOINTS.ATLETAS.LIST);
          if (res.ok) {
            const data = await res.json();
            setAtletas(data);
            // Seleccionar el primer atleta por defecto
            if (data.length > 0) {
              setSelectedAtletaId(data[0].id);
            }
          }
        } catch (error) {
          toast.error('No se pudieron cargar los atletas.');
        }
      };
      fetchAtletas();
    }
  }, [session]);

  // Cargar datos de rendimiento cuando el atleta objetivo cambie
  useEffect(() => {
    if (!targetAtletaId) return;

    const fetchRendimiento = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(API_ENDPOINTS.RENDIMIENTO.GET(targetAtletaId));
        if (res.ok) {
          const data = await res.json();
          // Ordenar los datos por fecha para el gráfico
          data.sort((a: RegistroRendimiento, b: RegistroRendimiento) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
          setRendimiento(data);
        } else {
          toast.error('No se pudieron cargar los datos de rendimiento.');
          setRendimiento([]);
        }
      } catch (error) {
        toast.error('Error de red al cargar el rendimiento.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRendimiento();
  }, [targetAtletaId]);

  const formattedData = rendimiento.map(r => ({
    ...r,
    fecha: new Date(r.fecha).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Evolución del Rendimiento</h2>
          <p className="text-muted-foreground">
            Visualiza el progreso histórico de los levantamientos y el total.
          </p>
        </div>
        {['Administrador', 'Entrenador'].includes(session?.user.role || '') && (
          <div className="w-full md:w-1/3">
            <Label>Seleccionar Atleta</Label>
            <Select value={selectedAtletaId} onValueChange={setSelectedAtletaId}>
              <SelectTrigger>
                <SelectValue placeholder="Elige un atleta..." />
              </SelectTrigger>
              <SelectContent>
                {atletas.map(atleta => (
                  <SelectItem key={atleta.id} value={atleta.id}>
                    {atleta.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-16 w-16 animate-spin" />
        </div>
      ) : rendimiento.length === 0 ? (
        <Card>
            <CardHeader>
                <CardTitle>Sin Datos Registrados</CardTitle>
            </CardHeader>
            <CardContent>
                <p>No se ha registrado ningún dato de rendimiento para el atleta seleccionado.</p>
                <p className="text-sm text-muted-foreground mt-2">
                    El historial de rendimiento se actualiza automáticamente cuando un atleta completa una sesión de entrenamiento que incluye sentadilla, press de banca o peso muerto, o cuando se registran los resultados de una competencia.
                </p>
            </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Gráfico de Progresión de Fuerza</CardTitle>
              <CardDescription>
                Muestra la evolución del peso levantado (en kg) en los tres movimientos principales a lo largo del tiempo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={formattedData}>
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sentadilla" name="Sentadilla" stroke="#8884d8" />
                  <Line type="monotone" dataKey="press_banca" name="Press de Banca" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="peso_muerto" name="Peso Muerto" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Registros</CardTitle>
              <CardDescription>
                Tabla con todos los registros de rendimiento, ya sea de entrenamientos o competencias.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Sentadilla (kg)</TableHead>
                    <TableHead>Press de Banca (kg)</TableHead>
                    <TableHead>Peso Muerto (kg)</TableHead>
                    <TableHead>Total (kg)</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rendimiento.slice().reverse().map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.fecha).toLocaleDateString('es-GT')}</TableCell>
                      <TableCell>{r.sentadilla || '-'}</TableCell>
                      <TableCell>{r.press_banca || '-'}</TableCell>
                      <TableCell>{r.peso_muerto || '-'}</TableCell>
                      <TableCell className="font-bold">{r.total}</TableCell>
                      <TableCell className="capitalize">{r.tipo_registro}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
