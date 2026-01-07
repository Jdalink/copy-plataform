'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EntrenadorDetails, AtletaAsignado } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FaUser, FaPhone, FaBuilding, FaCertificate, FaStar, FaUsers, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { generateFichaEntrenadorPdf } from '@/lib/report-generator';

export default function EntrenadorDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [entrenador, setEntrenador] = useState<EntrenadorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === 'admin';
  const isEntrenador = session?.user?.role === 'Entrenador';

  const fetchEntrenadorDetails = async () => {
    if (!session) return;

    // Si es un entrenador viendo su propio perfil, no necesita un ID en la URL.
    // Si es un admin y no hay ID, entonces es un error.
    if (!isEntrenador && (!id || id === 'undefined')) {
      setError("ID de entrenador inválido o no proporcionado.");
      return;
    }

    try {
      setLoading(true);
      // Si es un entrenador, usa el endpoint 'me'. Si es admin, usa el ID de la URL.
      const endpoint = isEntrenador ? '/api/entrenadores/me' : `/api/entrenadores/${id}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Error al obtener los detalles del entrenador');
      }
      const data: EntrenadorDetails = await response.json();

      if (isEntrenador) {
        const atletasResponse = await fetch('/api/entrenadores/me/atletas');
        if (atletasResponse.ok) {
          const atletasData = await atletasResponse.json();
          data.atletasAsignados = atletasData;
        }
      }
      
      setEntrenador(data);
    } catch (err: any) {
      setError(err.message);
      toast.error('Error al cargar entrenador', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntrenadorDetails();
  }, [id, session]); // Se ejecuta cuando la sesión o el ID cambian

  const getInitials = (nombre: string, apellido: string) => {
    return `${nombre[0] || ''}${apellido[0] || ''}`.toUpperCase();
  };

  // --- INICIO CORRECCIÓN: Función para generar la ficha ---
  const handleGenerateFicha = () => {
    if (entrenador) {
      // La función ya no necesita parámetros extra, es autosuficiente.
      generateFichaEntrenadorPdf(entrenador);
      toast.info("Generando ficha del entrenador...", { description: "La descarga comenzará en breve." });
    }
  };
  // --- FIN CORRECCIÓN ---

  if (loading) {
    return <EntrenadorDetailSkeleton />;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error al cargar los datos: {error}</div>;
  }

  if (!entrenador) {
    return <div className="p-4">No se encontró al entrenador.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
        <FaArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <Card className="mb-6">
        <CardContent className="pt-6 flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={(entrenador as any).foto_url || undefined} />
            <AvatarFallback className="text-3xl">
              {getInitials(entrenador.nombre, entrenador.apellido)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold">{entrenador.nombre} {entrenador.apellido}</h2>
            <p className="text-lg text-muted-foreground">{entrenador.email}</p>
            <Badge variant={entrenador.activo ? 'default' : 'destructive'} className="mt-2">
              {entrenador.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          {/* --- INICIO CORRECCIÓN: Botón para generar ficha --- */}
          <div className="md:ml-auto">
            <Button onClick={handleGenerateFicha} disabled={loading || !entrenador}>
              Generar Ficha
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FaUser /> Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={<FaPhone />} label="Teléfono" value={entrenador.telefono || 'N/A'} />
            <InfoItem icon={<FaBuilding />} label="Asociación" value={entrenador.asociacion_departamental || 'N/A'} />
            <InfoItem icon={<FaStar />} label="Experiencia" value={entrenador.experiencia ? `${entrenador.experiencia} años` : 'N/A'} />
            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><FaCertificate /> Certificaciones</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {entrenador.certificaciones?.length ? entrenador.certificaciones.map((cert, i) => (
                  <Badge key={i} variant="secondary">{cert}</Badge>
                )) : <p className="text-sm">N/A</p>}
              </div>
            </div>
            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><FaStar /> Especialidades</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {entrenador.especialidades?.length ? entrenador.especialidades.map((spec, i) => (
                  <Badge key={i} variant="secondary">{spec}</Badge>
                )) : <p className="text-sm">N/A</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FaUsers /> Atletas Asignados</CardTitle>
            <CardDescription>Lista de atletas actualmente bajo la supervisión de este entrenador.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Identificación</TableHead>
                  <TableHead>Asociación</TableHead>
                  <TableHead>Desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entrenador.atletasAsignados?.length ? entrenador.atletasAsignados.map(atleta => (
                  <TableRow key={atleta.atleta_id}>
                    {/* CORRECCIÓN: Usar atleta.atleta_id para el enlace, que ahora está garantizado por la API. */}
                    <TableCell className="font-medium">
                      <Link href={`/atletas/${atleta.atleta_id}`} className="font-medium text-primary hover:underline">
                        {atleta.nombre_completo}
                      </Link>
                    </TableCell>
                    <TableCell>{atleta.codigo_identificacion || 'N/A'}</TableCell>
                    <TableCell>{atleta.asociacion_departamental || 'N/A'}</TableCell>
                    <TableCell>{new Date(atleta.fecha_inicio).toLocaleDateString()}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">No hay atletas asignados.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
  <div className="flex items-center gap-3">
    <div className="text-gray-500">{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  </div>
);

const EntrenadorDetailSkeleton = () => (
  <div className="container mx-auto p-4 space-y-6">
    <Skeleton className="h-9 w-28 mb-4" />
    <Card>
      <CardContent className="pt-6 flex flex-col md:flex-row items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-32" /></div>
            </div>
          ))}
          <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-5 w-40" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-5 w-40" /></div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-full mt-2" /></CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);