"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Atleta, PlanEntrenamiento, PlanNutricional, Competencia } from '@/lib/definitions';
import { Loader2, ArrowLeft, User, Mail, Phone, Cake, MapPin, Building, Scale, Ruler, ShieldCheck, BookOpen, Utensils, Trophy, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlanDetailDialog } from '../../../../components/plans/plan-detail-dialog';
import { DietPlanDetailDialog } from '../../../../components/plans/diet-plan-detail-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSession } from 'next-auth/react'; // Importar useSession
import Image from 'next/image';

type AtletaDetails = Atleta & {
  planes_entrenamiento: PlanEntrenamiento[];
  planes_nutricionales: PlanNutricional[];
  competencias: Competencia[];
  entrenador_nombre: string | null;
};

// --- NUEVO: Función auxiliar para limpiar URLs de imágenes ---
const getImageUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanedPath = path.replace(/^(\/)?uploads\//, '');
  return `/api/admin/documentos/${cleanedPath}`;
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-1" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function AtletaDetailPage() {
  const [atleta, setAtleta] = useState<AtletaDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [selectedTrainingPlan, setSelectedTrainingPlan] = useState<PlanEntrenamiento | null>(null);
  const [selectedDietPlan, setSelectedDietPlan] = useState<PlanNutricional | null>(null);

  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession(); // Obtener la sesión
  const id = params.id as string;

  const fetchAtletaDetails = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/atletas/${id}`);
      if (!res.ok) {
        throw new Error('No se pudo cargar la información del atleta.');
      }
      const data = await res.json();
      setAtleta(data);
    } catch (error: any) {
      toast.error('Error al cargar datos', { description: error.message });
      router.push('/atletas');
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchAtletaDetails();
  }, [fetchAtletaDetails]);

  const toggleWeightUnit = () => {
    setWeightUnit(prev => (prev === 'kg' ? 'lb' : 'kg'));
  };

  const getConvertedWeight = () => {
    if (!atleta?.peso_corporal) return 'N/A';
    // --- CORRECCIÓN: Asegurarse de que el peso sea un número ---
    // La API puede devolver el peso como string, lo convertimos a número flotante.
    const weightInKg = parseFloat(atleta.peso_corporal as any);
    if (isNaN(weightInKg)) return 'N/A'; // Si no es un número válido, no mostrar nada.
    if (weightUnit === 'kg') {
      return `${weightInKg.toFixed(2)} kg`;
    } else {
      const weightInLb = weightInKg * 2.20462;
      return `${weightInLb.toFixed(2)} lb`;
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  if (!atleta) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <p className="text-xl text-muted-foreground mb-4">Atleta no encontrado.</p>
        <Button onClick={() => router.push('/atletas')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
        </Button>
      </div>
    );
  }

  // --- INICIO CORRECCIÓN: Determinar si el usuario es un entrenador ---
  const isEntrenador = session?.user?.role === 'Entrenador';

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <Button variant="outline" onClick={() => router.push('/atletas')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista de atletas
      </Button>

      {/* --- CORRECCIÓN: Reorganización completa del layout en una cuadrícula principal --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- Columna Izquierda: Perfil y Documentos --- */}
        <div className="flex flex-col space-y-8">
          <Card> {/* Tarjeta de Perfil */}
            <CardHeader className="text-center">
              {/* --- CORRECCIÓN: Usar getImageUrl para la foto de perfil --- */}
              <div className="w-24 h-24 rounded-full bg-muted mx-auto flex items-center justify-center mb-4 overflow-hidden">
                {atleta.foto_url ? (
                  <Image src={getImageUrl(atleta.foto_url)} alt={`Foto de ${atleta.nombre_completo}`} width={96} height={96} className="object-cover w-full h-full" />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <CardTitle className="text-2xl">{atleta.nombre_completo}</CardTitle>
              <CardDescription>{atleta.email}</CardDescription>
              <Badge variant={atleta.activo ? 'default' : 'destructive'} className="mx-auto mt-2">
                {atleta.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem icon={Phone} label="Teléfono" value={atleta.telefono} />
              <InfoItem icon={Cake} label="Fecha de Nacimiento" value={atleta.fecha_nacimiento ? new Date(atleta.fecha_nacimiento).toLocaleDateString('es-GT', { timeZone: 'UTC' }) : 'N/A'} />
              <InfoItem icon={ShieldCheck} label="CUI / Identificación" value={atleta.codigo_identificacion} />
              <InfoItem icon={User} label="Entrenador" value={atleta.entrenador_nombre || 'No asignado'} />
            </CardContent>
          </Card>

          {/* --- INICIO CORRECCIÓN: Ocultar documentos para entrenadores --- */}
          {!isEntrenador && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5" /> Documento (Frente)</CardTitle>
                </CardHeader>
                <CardContent>
                  {atleta.documento_dpi_frente ? (
                    <Image src={getImageUrl(atleta.documento_dpi_frente)} alt="DPI Frente" width={400} height={250} className="rounded-lg border w-full object-contain" />
                  ) : <p className="text-sm text-muted-foreground">No hay documento frontal.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5" /> Documento (Reverso)</CardTitle>
                </CardHeader>
                <CardContent>
                  {atleta.documento_dpi_reverso ? (
                    <Image src={getImageUrl(atleta.documento_dpi_reverso)} alt="DPI Reverso" width={400} height={250} className="rounded-lg border w-full object-contain" />
                  ) : <p className="text-sm text-muted-foreground">No hay documento reverso.</p>}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* --- Columna Derecha: Información detallada y planes --- */}
        <div className="flex flex-col space-y-8">
          {/* Tarjeta de Información Física y Adicional (Fusionada) */}
          <Card>
            <CardHeader>
              <CardTitle>Información Física</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Scale className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Peso Corporal</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{getConvertedWeight()}</p>
                    <Button size="sm" variant="outline" onClick={toggleWeightUnit}>
                      Convertir a {weightUnit === 'kg' ? 'lb' : 'kg'}
                    </Button>
                  </div>
                </div>
              </div>
              <InfoItem icon={Ruler} label="Altura" value={atleta.altura_cm ? `${atleta.altura_cm} cm` : 'N/A'} />
            </CardContent>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem icon={Building} label="Asociación Departamental" value={atleta.asociacion_departamental} />
              <InfoItem icon={User} label="Etnia" value={atleta.etnia} />
              <InfoItem icon={User} label="Comunidad Lingüística" value={atleta.comunidad_linguistica} />
              <InfoItem icon={MapPin} label="Nacionalidad" value={atleta.nacionalidad} />
              <InfoItem icon={MapPin} label="Departamento" value={atleta.departamento} />
              <InfoItem icon={MapPin} label="Municipio" value={atleta.municipio} />              
              {/* --- INICIO CORRECCIÓN: Ocultar dirección para entrenadores --- */}
              {!isEntrenador && <InfoItem icon={MapPin} label="Dirección" value={atleta.direccion_residencia} />}
            </CardContent>
          </Card>

          {/* Historial de Competencias */}
          <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center">
            <Trophy className="mr-3 h-6 w-6" />
            Historial de Competencias
          </h2>
          {atleta.competencias && atleta.competencias.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competencia</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Lugar</TableHead>
                      <TableHead className="text-right">Total (kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atleta.competencias.map(comp => (
                      <TableRow key={comp.id}>
                        <TableCell className="font-medium">{comp.nombre}</TableCell>
                        <TableCell>{comp.fecha ? new Date(comp.fecha).toLocaleDateString('es-GT', { timeZone: 'UTC' }) : 'N/A'}</TableCell>
                        <TableCell>{comp.lugar}</TableCell>
                        <TableCell className="text-right">{comp.total_levantado}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground">No hay historial de competencias registrado.</p>
          )}

          {/* Planes de Entrenamiento */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center">
              <BookOpen className="mr-3 h-6 w-6" />
              Planes de Entrenamiento
            </h2>
            {atleta.planes_entrenamiento?.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {atleta.planes_entrenamiento.map(plan => (
                  <Card key={plan.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{plan.nombre}</CardTitle>
                      <CardDescription>
                        {plan.objetivo} - {plan.duracion_semanas} semanas
                      </CardDescription> 
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Inició el: {plan.fecha_inicio ? new Date(plan.fecha_inicio).toLocaleDateString('es-GT', { timeZone: 'UTC' }) : 'No especificado'}
                      </p>
                      <Button 
                        className="w-full mt-4" 
                        variant="outline"
                        onClick={() => setSelectedTrainingPlan(plan)}
                      >
                        Ver Detalles
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay planes de entrenamiento asignados.</p>
            )}
          </div>

          {/* Planes de Alimentación */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center">
              <Utensils className="mr-3 h-6 w-6" />
              Planes de Alimentación
            </h2>
            {atleta.planes_nutricionales && atleta.planes_nutricionales.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {atleta.planes_nutricionales.map(plan => (
                  <Card key={plan.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{plan.nombre || 'Plan de Alimentación'}</CardTitle>
                      <CardDescription>
                        {plan.objetivo}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Inició el: {plan.fecha_inicio ? new Date(plan.fecha_inicio).toLocaleDateString('es-GT', { timeZone: 'UTC' }) : 'No especificado'}
                      </p>
                      <Button 
                        className="w-full mt-4" 
                        variant="outline"
                        onClick={() => setSelectedDietPlan(plan)}
                      >
                        Ver Detalles
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay planes de alimentación asignados.</p>
            )}
          </div>
        </div>
      </div>

      {/* Diálogos para detalles de planes */}
      {selectedTrainingPlan && (
        <PlanDetailDialog
          isOpen={!!selectedTrainingPlan}
          onClose={() => setSelectedTrainingPlan(null)}
          plan={selectedTrainingPlan}
        />
      )}

      {selectedDietPlan && (
        <DietPlanDetailDialog
          isOpen={!!selectedDietPlan}
          onClose={() => setSelectedDietPlan(null)}
          plan={selectedDietPlan}
        />
      )}
    </div>
  );
}