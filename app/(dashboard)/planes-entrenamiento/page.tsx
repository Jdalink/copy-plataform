"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from '@/components/ui/label';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Brain, User, Loader2, Download, CalendarPlus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { API_ENDPOINTS } from "@/lib/api-config"
import { ConfirmationDialog } from "@/components/reusable/confirmation-dialog";
import { PlanDetailDialog } from "../../../components/plans/plan-detail-dialog";
import { PlanEntrenamiento } from "@/lib/definitions";
import { useSession } from "next-auth/react";

// --- INTERFACES ---
interface AtletaSimple {
  id: string;
  nombre_completo: string;
}

// --- COMPONENTE PRINCIPAL ---
export default function PlanesEntrenamientoPage() {
  const [planes, setPlanes] = useState<PlanEntrenamiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState<PlanEntrenamiento | null>(null);
  const [showGenerateWeekDialog, setShowGenerateWeekDialog] = useState<PlanEntrenamiento | null>(null);
  const [planToDelete, setPlanToDelete] = useState<PlanEntrenamiento | null>(null);
  const { toast } = useToast();

  const fetchPlanes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.PLANES_ENTRENAMIENTO.LIST);
      if (!response.ok) throw new Error("Error al cargar los planes");
      const data = await response.json();
      setPlanes(data);
    } catch (error) {
      toast({ title: "Error de Carga", description: "No se pudieron cargar los planes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchPlanes(); }, [fetchPlanes]);

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      const response = await fetch(API_ENDPOINTS.PLANES_ENTRENAMIENTO.DELETE(planToDelete.id), {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('No se pudo eliminar el plan');
      }
      toast({
        title: 'Plan Eliminado',
        description: `El plan "${planToDelete.nombre}" ha sido eliminado.`,
      });
      fetchPlanes(); // Refresh the list
    } catch (error) {
      toast({
        title: 'Error al Eliminar',
        description: 'Ocurrió un error al eliminar el plan.',
        variant: 'destructive',
      });
    } finally {
      setPlanToDelete(null); // Close the dialog
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Planes de Entrenamiento</h2>
          <p className="text-muted-foreground">Genera y gestiona planes de entrenamiento personalizados.</p>
        </div>
        <Button onClick={() => setShowGenerateDialog(true)}>
          <Brain className="mr-2 h-4 w-4" />
          Generar Plan Inteligente
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {planes.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{plan.nombre}</CardTitle>
                   <CardDescription>
                    <div className="flex items-center space-x-2 text-sm pt-1"><User className="h-3 w-3" /><span>{plan.atleta_nombre} {plan.atleta_apellido}</span></div>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {plan.generado_por_ia && <Badge variant="secondary"><Brain className="h-3 w-3 mr-1" />IA</Badge>}
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setPlanToDelete(plan)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-muted-foreground">Objetivo</p><p className="font-medium">{plan.objetivo}</p></div>
                <div><p className="text-muted-foreground">Nivel</p><p className="font-medium">{plan.nivel}</p></div>
                <div><p className="text-muted-foreground">Frecuencia</p><p className="font-medium">{plan.frecuencia} días/sem</p></div>
                <div><p className="text-muted-foreground">Duración</p><p className="font-medium">{plan.duracion_semanas} sem</p></div>
              </div>
            </CardContent>
            <CardFooter className="mt-auto grid grid-cols-2 gap-2">
                <Button className="w-full" variant="outline" onClick={() => setShowDetailDialog(plan)}>Ver Detalles</Button>
                <Button className="w-full" onClick={() => setShowGenerateWeekDialog(plan)}><CalendarPlus className="mr-2 h-4 w-4" />Generar</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <GeneratePlanDialog isOpen={showGenerateDialog} onClose={() => setShowGenerateDialog(false)} onPlanGenerated={fetchPlanes} />
      <PlanDetailDialog isOpen={!!showDetailDialog} onClose={() => setShowDetailDialog(null)} plan={showDetailDialog} />
      <GenerateWeekDialog isOpen={!!showGenerateWeekDialog} onClose={() => setShowGenerateWeekDialog(null)} plan={showGenerateWeekDialog} />
      <ConfirmationDialog
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleDeletePlan}
        title="¿Estás seguro de que deseas eliminar este plan?"
        description="Esta acción es irreversible. El plan de entrenamiento se eliminará permanentemente."
      />
    </div>
  )
}

// --- Diálogo para Generar Plan con IA ---
function GeneratePlanDialog({ isOpen, onClose, onPlanGenerated }: { isOpen: boolean, onClose: () => void, onPlanGenerated: () => void }) {
    const [atletas, setAtletas] = useState<AtletaSimple[]>([]);
    const [formData, setFormData] = useState({
        atleta_id: "",
        objetivo: "Acumulación de Volumen",
        nivel: "Intermedio",
        frecuencia: 4,
        duracion_semanas: 8,
        enfoque_principal: "Fuerza Máxima (Powerlifting)",
        dias_preferidos: "Lunes, Martes, Jueves, Viernes",
        unidades_peso: "kg",
        squat_1rm: 0,
        bench_1rm: 0,
        deadlift_1rm: 0,
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const { data: session } = useSession();

    useEffect(() => {
        if (isOpen) {
            const fetchAtletas = async () => {
                try {
                    // --- INICIO CORRECCIÓN: Usar el endpoint correcto según el rol ---
                    const isEntrenador = session?.user?.role === 'Entrenador';
                    const endpoint = isEntrenador 
                      ? API_ENDPOINTS.ENTRENADORES.GET_MY_ATLETAS 
                      : API_ENDPOINTS.ATLETAS.LIST;
                    const res = await fetch(endpoint);
                    if (res.ok) setAtletas(await res.json());
                    else toast({ title: "Error", description: "No se pudieron cargar los atletas."});
                } catch (error) {
                     toast({ title: "Error de Red", description: "No se pudo conectar con el servidor."});
                }
            };
            fetchAtletas();
        }
    }, [isOpen, toast, session]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        try {
            const response = await fetch(API_ENDPOINTS.IA.GENERATE_TRAINING_PLAN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error("La IA no pudo generar el plan.");
            toast({ title: "Plan Generado", description: "El nuevo plan ha sido creado y guardado." });
            onPlanGenerated();
            onClose();
        } catch (error) {
            toast({ title: "Error de Generación", description: "No se pudo generar el plan. Inténtalo de nuevo.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Generar Plan de Entrenamiento Inteligente</DialogTitle>
                    <DialogDescription>Define los parámetros para que la IA cree un plan de entrenamiento profesional y a medida.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleGenerate} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label>Atleta *</Label>
                            <Select value={formData.atleta_id} onValueChange={v => setFormData(p => ({...p, atleta_id: v}))} required>
                                <SelectTrigger><SelectValue placeholder="Seleccionar atleta..." /></SelectTrigger>
                                <SelectContent>{atletas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre_completo}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2"><Label>Objetivo de esta Fase</Label><Select value={formData.objetivo} onValueChange={v => setFormData(p => ({...p, objetivo: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Acumulación de Volumen">Acumulación de Volumen</SelectItem><SelectItem value="Intensificación (Fuerza)">Intensificación (Fuerza)</SelectItem><SelectItem value="Peaking (Puesta a punto)">Peaking (Puesta a punto)</SelectItem><SelectItem value="Descarga Activa">Descarga Activa</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Nivel del Atleta</Label><Select value={formData.nivel} onValueChange={v => setFormData(p => ({...p, nivel: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Principiante">Principiante</SelectItem><SelectItem value="Intermedio">Intermedio</SelectItem><SelectItem value="Avanzado">Avanzado</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Frecuencia (días/semana)</Label><Select value={String(formData.frecuencia)} onValueChange={v => setFormData(p => ({...p, frecuencia: parseInt(v)}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="3">3 días</SelectItem><SelectItem value="4">4 días</SelectItem><SelectItem value="5">5 días</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Duración (semanas)</Label><Select value={String(formData.duracion_semanas)} onValueChange={v => setFormData(p => ({...p, duracion_semanas: parseInt(v)}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="4">4 semanas</SelectItem><SelectItem value="8">8 semanas</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Unidades de Peso</Label><Select value={formData.unidades_peso} onValueChange={v => setFormData(p => ({...p, unidades_peso: v as 'kg' | 'lb'}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="kg">Kilogramos (kg)</SelectItem><SelectItem value="lb">Libras (lb)</SelectItem></SelectContent></Select></div>
                        {/* --- NUEVO: Campos para 1RM --- */}
                        <div className="space-y-2"><Label>1RM Sentadilla ({formData.unidades_peso})</Label><Input type="number" value={formData.squat_1rm} onChange={e => setFormData(p => ({...p, squat_1rm: parseInt(e.target.value) || 0}))} /></div>
                        <div className="space-y-2"><Label>1RM Press de Banca ({formData.unidades_peso})</Label><Input type="number" value={formData.bench_1rm} onChange={e => setFormData(p => ({...p, bench_1rm: parseInt(e.target.value) || 0}))} /></div>
                        <div className="space-y-2"><Label>1RM Peso Muerto ({formData.unidades_peso})</Label><Input type="number" value={formData.deadlift_1rm} onChange={e => setFormData(p => ({...p, deadlift_1rm: parseInt(e.target.value) || 0}))} /></div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isGenerating}>Cancelar</Button>
                        <Button type="submit" disabled={isGenerating || !formData.atleta_id}>
                            {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</> : <><Brain className="mr-2 h-4 w-4" />Generar Plan</>}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// --- Diálogo para Generar Entrenamientos de la Semana ---
function GenerateWeekDialog({ isOpen, onClose, plan }: { isOpen: boolean, onClose: () => void, plan: PlanEntrenamiento | null }) {
    const [selectedWeek, setSelectedWeek] = useState<number>(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!plan) return;
        setIsGenerating(true);
        try {
            const response = await fetch(API_ENDPOINTS.PLANES_ENTRENAMIENTO.GENERATE_WEEK(plan.id), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekNumber: selectedWeek })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Error desconocido");
            toast({ title: "Éxito", description: result.message });
            onClose();
        } catch (error: any) {
            toast({ title: "Error al generar", description: error.message, variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generar Entrenamientos de la Semana</DialogTitle>
                    <DialogDescription>Crea las sesiones de entrenamiento diarias basadas en el plan maestro.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p>Plan: <strong>{plan?.nombre}</strong></p>
                    <p>Atleta: <strong>{plan?.atleta_nombre} {plan?.atleta_apellido}</strong></p>
                    <Label htmlFor="week-select">Selecciona la semana que quieres generar:</Label>
                    <Select onValueChange={(v) => setSelectedWeek(Number(v))} defaultValue="1">
                        <SelectTrigger id="week-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {plan && Array.from({ length: plan.duracion_semanas }, (_, i) => i + 1).map(week => (
                                <SelectItem key={week} value={String(week)}>Semana {week}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">Nota: Solo se crearán entrenamientos para los días que no tengan ya una sesión asignada en esa fecha.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generar Semana
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}