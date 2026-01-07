"use client"

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // Importación ya existe
import { Dumbbell, Calendar, Download, Loader2, AlertTriangle, User, Cake, Weight, Ruler, Mail, Phone, Trophy } from "lucide-react";
import { useSession } from "next-auth/react";
import { API_ENDPOINTS } from "@/lib/api-config";
import jsPDF from "jspdf";
import autoTable, { RowInput } from 'jspdf-autotable'; // CORRECCIÓN: Importar RowInput
import { PlanEntrenamientoDetallado, Atleta, PlanNutricional } from "@/lib/definitions";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// --- INICIO DE LA CORRECCIÓN: Tipos y Estado para Competencias ---
// 1. Definir tipos para la información que vamos a necesitar.
type AtletaConDetalles = Atleta & {
    planes_nutricionales?: PlanNutricional[];
    entrenador_asignado?: {
        nombre: string;
        email: string;
    };
};

interface ProximaCompetencia {
    id: string;
    nombre: string;
    fecha: string;
}
// --- FIN DE LA CORRECCIÓN ---

export default function AtletaDashboard() {
    const { data: session } = useSession();
    const [activePlan, setActivePlan] = useState<PlanEntrenamientoDetallado | null>(null);
    // 2. Usar el nuevo tipo `AtletaConDetalles` para el estado.
    const [atletaInfo, setAtletaInfo] = useState<AtletaConDetalles | null>(null);
    const [seguimiento, setSeguimiento] = useState<Record<string, boolean>>({});
    // 3. Añadir estado para las próximas competencias.
    const [proximasCompetencias, setProximasCompetencias] = useState<ProximaCompetencia[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!session?.user?.atleta_id) return;
        setIsLoading(true);
        try {
            const [planRes, atletaRes, seguimientoRes, competenciasRes] = await Promise.all([
                fetch(API_ENDPOINTS.ATLETAS.GET_ACTIVE_PLAN),
                fetch(API_ENDPOINTS.ATLETAS.DETAILS(session.user.atleta_id)),
                fetch(API_ENDPOINTS.SEGUIMIENTO.GET_BY_ATLETA),
                fetch(API_ENDPOINTS.COMPETENCIAS.PROXIMAS_PARA_ATLETA) // 4. Nueva llamada a la API
            ]);
            
            if (planRes.ok) setActivePlan(await planRes.json());
            if (atletaRes.ok) setAtletaInfo(await atletaRes.json());
            if (seguimientoRes.ok) {
                const data = await seguimientoRes.json();
                const seguimientoMap = data.reduce((acc: any, item: any) => {
                    acc[`${item.semana}-${item.dia}`] = item.completado;
                    return acc;
                }, {});
                setSeguimiento(seguimientoMap);
            }
            // 5. Guardar los resultados de las competencias en el estado.
            if (competenciasRes.ok) {
                const data = await competenciasRes.json();
                setProximasCompetencias(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (session) {
            fetchData();
        }
    }, [session, fetchData]);
    
    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-9 w-1/3" />
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                        <CardContent><Skeleton className="h-48 w-full" /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Bienvenido, {session?.user?.fullName || session?.user?.name}</h2>
            
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {activePlan ? (
                        <PlanSemanal plan={activePlan} seguimiento={seguimiento} onUpdate={fetchData} />
                    ) : (
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Dumbbell /> Plan de Entrenamiento</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center justify-center text-center p-8">
                                    <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-semibold">No tienes un plan activo</h3>
                                    <p className="text-muted-foreground mt-2">Ponte en contacto con tu entrenador para que te asigne un plan.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {/* --- CORRECCIÓN: Buscar el plan más reciente en el array --- */}
                    {atletaInfo?.planes_nutricionales && atletaInfo.planes_nutricionales.length > 0 ? ( // CORRECCIÓN: Usar optional chaining
                        // La API ya devuelve los planes ordenados por fecha desc, tomamos el primero.
                        <PlanAlimentacion plan={atletaInfo.planes_nutricionales[0]} />
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">🥗 Plan de Alimentación</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center justify-center text-center p-8">
                                    <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-semibold">Sin Plan de Alimentación</h3>
                                    <p className="text-muted-foreground mt-2">Tu entrenador aún no te ha asignado un plan de alimentación.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User /> Mi Perfil</CardTitle>
                            <CardDescription>Resumen de tu información personal.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <InfoItem icon={Cake} label="F. Nacimiento" value={atletaInfo?.fecha_nacimiento ? format(new Date(atletaInfo.fecha_nacimiento), "d 'de' LLLL 'de' yyyy", { locale: es }) : "N/A"} />
                            <InfoItem icon={Weight} label="Peso Corporal" value={atletaInfo?.peso_corporal ? `${atletaInfo.peso_corporal} kg` : "N/A"} />
                            <InfoItem icon={Ruler} label="Altura" value={atletaInfo?.altura_cm ? `${atletaInfo.altura_cm} cm` : "N/A"} />
                            <InfoItem icon={Mail} label="Email" value={atletaInfo?.email || "N/A"} />
                            <InfoItem icon={Phone} label="Teléfono" value={atletaInfo?.telefono || "N/A"} />
                        </CardContent>
                        {/* --- INICIO CORRECCIÓN: Se elimina el botón de editar perfil --- */}
                        {/* El perfil ahora se edita desde la barra lateral */}
                        {/* --- FIN CORRECCIÓN --- */}
                    </Card>

                    {/* --- INICIO CORRECCIÓN: Nueva tarjeta de Próximas Competencias --- */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Trophy /> Próximas Competencias</CardTitle>
                            <CardDescription>Eventos disponibles para tu categoría.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {proximasCompetencias.length > 0 ? (
                                <div className="space-y-4">
                                    {proximasCompetencias.map((comp) => (
                                        <div key={comp.id} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{comp.nombre}</p>
                                                <p className="text-sm text-muted-foreground">{format(new Date(comp.fecha), "d 'de' LLLL, yyyy", { locale: es })}</p>
                                            </div>
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/competencias/${comp.id}`}>Ver</Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No hay competencias próximas.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-center text-sm">
        <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="font-semibold mr-2">{label}:</span>
        <span className="text-muted-foreground">{value}</span>
    </div>
);

function PlanSemanal({ plan, seguimiento, onUpdate }: { plan: PlanEntrenamientoDetallado, seguimiento: Record<string, boolean>, onUpdate: () => void }) {
    const [selectedWeek, setSelectedWeek] = useState(1);
    const [updatingDia, setUpdatingDia] = useState<string | null>(null);
    const weekKey = `semana_${selectedWeek}`;
    const weekData = plan.plan_detallado?.[weekKey];

    const handleMarcarCompletado = async (diaKey: string) => {
        setUpdatingDia(diaKey); // Muestra el loader para este día específico
        try {
            // CORRECCIÓN: Se determina el nuevo estado antes de la llamada a la API
            const nuevoEstado = !seguimiento[`${selectedWeek}-${diaKey}`];
            await fetch(API_ENDPOINTS.SEGUIMIENTO.UPDATE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan_id: plan.id,
                    semana: selectedWeek,
                    dia: diaKey,
                    completado: nuevoEstado,
                }),
            });
            onUpdate();
        } catch (error) {
            console.error("Error updating seguimiento", error);
        } finally {
            setUpdatingDia(null); // Oculta el loader
        }
    };
    
    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(plan.nombre, 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`Objetivo: ${plan.objetivo || 'General'}`, 105, 28, { align: 'center' });
        
        const bodyData: RowInput[] = Object.entries(plan.plan_detallado).flatMap(([semanaKey, semanaVal]: [string, any]) => {
            const semanaHeader: RowInput = [{ content: semanaKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), colSpan: 4, styles: { fontStyle: 'bold', fillColor: '#d3d3d3', textColor: 20 } }];
            
            const diasData = Object.entries(semanaVal).flatMap(([dia, detalles]: [string, any]) => {
                if (!Array.isArray(detalles.ejercicios)) return [];
                return detalles.ejercicios.map((ej: any, index: number) => {
                    const diaCell = index === 0 ? dia.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
                    const enfoqueCell = index === 0 ? detalles.enfoque : '';
                    const seriesReps = ej.series_reps || `${ej.series}x${ej.reps}`;
                    return [diaCell, enfoqueCell, ej.nombre, seriesReps];
                });
            });
            return [semanaHeader, ...diasData];
        });

        autoTable(doc, {
            startY: 45,
            head: [['Día', 'Enfoque', 'Ejercicio', 'Series y Reps']],
            body: bodyData,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
        });

        doc.save(`Plan_${plan.nombre}.pdf`);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Calendar /> Tu Plan Semanal: {plan.nombre}</CardTitle>
                        <CardDescription>Objetivo: {plan.objetivo || 'Mejora general'}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select onValueChange={(v) => setSelectedWeek(Number(v))} defaultValue="1">
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Seleccionar semana" /></SelectTrigger>
                            <SelectContent>{Array.from({ length: plan.duracion_semanas }, (_, i) => i + 1).map(week => <SelectItem key={week} value={String(week)}>Semana {week}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button variant="outline" onClick={generatePDF}><Download className="mr-2 h-4 w-4" /> PDF</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {weekData ? (
                    <div className="space-y-6">
                        {Object.entries(weekData).map(([dia, detalles]: [string, any]) => {
                            const diaKey = dia;
                            // CORRECCIÓN: Lógica más robusta para determinar si está completado
                            const isCompletado = !!seguimiento[`${selectedWeek}-${diaKey}`];
                            return(
                                <div key={dia}>
                                    <div className="flex justify-between items-center border-b pb-2 mb-2">
                                        <h4 className="font-semibold text-lg capitalize">{dia.replace('_', ' ')}: <span className="text-base font-normal text-muted-foreground">{detalles.enfoque}</span></h4>
                                        <Button size="sm" variant={isCompletado ? "secondary" : "default"} onClick={() => handleMarcarCompletado(diaKey)} disabled={updatingDia === diaKey} className="w-40">
                                            {updatingDia === diaKey ? <Loader2 className="h-4 w-4 animate-spin" /> : (isCompletado ? "✅ Completado" : "Finalizar Entrenamiento")}
                                        </Button>
                                    </div>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Ejercicio</TableHead><TableHead>Series y Reps</TableHead><TableHead>Peso/Intensidad</TableHead></TableRow></TableHeader>
                                        <TableBody>{Array.isArray(detalles.ejercicios) && detalles.ejercicios.map((ej: any, index: number) => (<TableRow key={index}><TableCell>{ej.nombre}</TableCell><TableCell>{ej.series_reps || `${ej.series}x${ej.reps}`}</TableCell><TableCell>{ej.peso} {ej.unidades_peso || 'kg'}</TableCell></TableRow>))}</TableBody>
                                    </Table>
                                </div>
                            )
                        })}
                    </div>
                ) : ( <p>No hay datos para la semana seleccionada.</p> )}
            </CardContent>
        </Card>
    );
}


interface Alimento {
    nombre: string;
    cantidad: string;
}

interface ComidaDetalle {
    horario: string;
    alimentos: Alimento[];
    calorias: number;
}

interface PlanAlimentacionData {
    nombre: string;
    recomendaciones?: string;
    plan_detallado: Record<string, ComidaDetalle>;
}

function PlanAlimentacion({ plan }: { plan: PlanNutricional }) { 
    // --- INICIO CORRECCIÓN: Parsear plan_detallado si es un string ---
    let planDetallado;
    try {
        planDetallado = typeof plan.plan_detallado === 'string' 
            ? JSON.parse(plan.plan_detallado) 
            : plan.plan_detallado;
    } catch (e) {
        console.error("Error al parsear el plan detallado:", e);
        return null; // No renderizar si el JSON es inválido
    }

    if (!plan || !planDetallado || typeof planDetallado !== 'object') {
        return null;
    }
    // --- FIN CORRECCIÓN ---

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Plan de Alimentación: ${plan.nombre}`, 105, 20, { align: 'center' });
        // CORRECCIÓN: Tipar correctamente los detalles para evitar errores de 'unknown'
        const body = Object.entries(planDetallado).map(([comida, detalles]: [string, any]) => [
            comida.charAt(0).toUpperCase() + comida.slice(1), // Comida
            detalles.horario, // Horario
            detalles.alimentos.map((a: any) => `${a.nombre} (${a.cantidad})`).join(', '), // Alimentos
            detalles.calorias // Calorías
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['Comida', 'Horario', 'Alimentos', 'Calorías (aprox)']],
            body: body,
        });

        doc.save(`Plan_Alimentacion_${plan.nombre}.pdf`);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">🥗 Plan de Alimentación: {plan.nombre}</CardTitle>
                        <CardDescription>Recomendaciones nutricionales para tus objetivos.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={generatePDF}><Download className="mr-2 h-4 w-4" /> PDF</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Comida</TableHead><TableHead>Horario</TableHead><TableHead>Alimentos</TableHead><TableHead>Calorías</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {/* CORRECCIÓN: Tipar correctamente los detalles para evitar errores de 'unknown' */}
                        {Object.entries(planDetallado).map(([comida, detalles]: [string, any]) => (
                            <TableRow key={comida}> 
                                <TableCell className="font-medium capitalize">{comida}</TableCell>
                                <TableCell>{detalles.horario}</TableCell>
                                <TableCell>{detalles.alimentos.map((a: any) => `${a.nombre} (${a.cantidad})`).join(', ')}</TableCell>
                                <TableCell>{detalles.calorias}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
