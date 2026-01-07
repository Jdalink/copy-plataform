"use client"

import { useState, useEffect, useCallback } from "react";
import { PlanNutricional } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Brain, Target, Flame, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api-config";
import { ConfirmationDialog } from "@/components/reusable/confirmation-dialog";
import { DietPlanDetailDialog } from "../../../components/plans/diet-plan-detail-dialog";

import { useSession } from "next-auth/react";
interface PlanAlimentacion {
  id: string;
  nombre: string;
  atleta_nombre: string;
  atleta_apellido: string;
  objetivo: string;
  calorias_diarias: number;
  fecha_inicio: string;
  activo: boolean;
  generado_por_ia: boolean;
  plan_detallado?: any;
}

interface AtletaSimple { id: string; nombre_completo: string; peso_corporal?: number; altura_cm?: number; sexo?: "Femenino" | "Masculino"; }

export default function PlanesAlimentacionPage() {
    const [planes, setPlanes] = useState<PlanAlimentacion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showGenerateDialog, setShowGenerateDialog] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PlanNutricional | null>(null);
    const [planToDelete, setPlanToDelete] = useState<PlanAlimentacion | null>(null);
    const { toast } = useToast();

    const fetchPlanes = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.PLANES_ALIMENTACION.LIST);
            if (!response.ok) throw new Error("Error al cargar los planes");
            setPlanes(await response.json());
        } catch (error) {
            toast({ title: "Error de Carga", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchPlanes(); }, [fetchPlanes]);
    
    const handleViewDetails = async (planId: string) => {
        try {
            const response = await fetch(API_ENDPOINTS.PLANES_ALIMENTACION.DETAILS(planId));
            if (!response.ok) throw new Error("No se pudieron cargar los detalles");
            const data = await response.json();
            setSelectedPlan(data);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los detalles del plan." });
        }
    };

    const handleDeletePlan = async () => {
        if (!planToDelete) return;
        try {
            const response = await fetch(API_ENDPOINTS.PLANES_ALIMENTACION.DELETE(planToDelete.id), {
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
                    <h2 className="text-3xl font-bold tracking-tight">Planes de Alimentación</h2>
                    <p className="text-muted-foreground">Genera y asigna planes nutricionales a los atletas.</p>
                </div>
                <Button onClick={() => setShowGenerateDialog(true)}><Brain className="mr-2 h-4 w-4" /> Generar Plan Inteligente</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {planes.map(plan => (
                    <Card key={plan.id} className="flex flex-col">
                        <CardHeader>
                             <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{plan.nombre}</CardTitle>
                                    <CardDescription>Para: {plan.atleta_nombre} {plan.atleta_apellido}</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setPlanToDelete(plan)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center text-sm"><Target className="mr-2 h-4 w-4 text-muted-foreground" /> <span>{plan.objetivo}</span></div>
                            <div className="flex items-center text-sm"><Flame className="mr-2 h-4 w-4 text-muted-foreground" /> <span>{plan.calorias_diarias} kcal/día</span></div>
                        </CardContent>
                        <CardFooter className="mt-auto">
                            <Button className="w-full" variant="outline" onClick={() => handleViewDetails(plan.id)}>Ver Detalles</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
            <GenerateDietPlanDialog isOpen={showGenerateDialog} onClose={() => setShowGenerateDialog(false)} onPlanGenerated={fetchPlanes} />
            <DietPlanDetailDialog isOpen={!!selectedPlan} onClose={() => setSelectedPlan(null)} plan={selectedPlan} />
            <ConfirmationDialog
                isOpen={!!planToDelete}
                onClose={() => setPlanToDelete(null)}
                onConfirm={handleDeletePlan}
                title="¿Estás seguro de que deseas eliminar este plan?"
                description="Esta acción es irreversible. El plan de alimentación se eliminará permanentemente."
            />
        </div>
    );
}

// --- Diálogo para Generar Plan ---
function GenerateDietPlanDialog({ isOpen, onClose, onPlanGenerated }: { isOpen: boolean, onClose: () => void, onPlanGenerated: () => void }) {
    const [atletas, setAtletas] = useState<AtletaSimple[]>([]);
    const [selectedAtleta, setSelectedAtleta] = useState<AtletaSimple | null>(null);
    const [formData, setFormData] = useState({ atleta_id: "", objetivo: "Mantenimiento", peso_actual: 0, peso_objetivo: 0, actividad_nivel: "Moderado", restricciones: "" });
    const [isGenerating, setIsGenerating] = useState(false);
    const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
    const { toast } = useToast();
    const { data: session } = useSession();

    const KG_TO_LB = 2.20462;

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
                    if(res.ok) setAtletas(await res.json());
                    else toast({ title: "Error", description: "No se pudieron cargar los atletas."});
                } catch (error) {
                    toast({ title: "Error de Red", description: "No se pudo conectar con el servidor."});
                }
            };
            fetchAtletas();
        }
    }, [isOpen, session, toast]);

    const handleAtletaChange = (atletaId: string) => {
        const atleta = atletas.find(a => a.id === atletaId);
        if (atleta) {
            setSelectedAtleta(atleta);
            const pesoKg = atleta.peso_corporal || 0;
            setFormData(p => ({
                ...p,
                atleta_id: atletaId,
                peso_actual: unit === 'kg' ? pesoKg : parseFloat((pesoKg * KG_TO_LB).toFixed(2)),
                peso_objetivo: unit === 'kg' ? pesoKg : parseFloat((pesoKg * KG_TO_LB).toFixed(2))
            }));
        }
    };
    
    const toggleUnit = () => {
        setUnit(prevUnit => {
            const newUnit = prevUnit === 'kg' ? 'lb' : 'kg';
            const conversionFactor = newUnit === 'lb' ? KG_TO_LB : 1 / KG_TO_LB;
            setFormData(p => ({
                ...p,
                peso_actual: parseFloat((p.peso_actual * conversionFactor).toFixed(2)),
                peso_objetivo: parseFloat((p.peso_objetivo * conversionFactor).toFixed(2))
            }));
            return newUnit;
        });
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const pesoObjetivoKg = unit === 'kg' ? formData.peso_objetivo : formData.peso_objetivo / KG_TO_LB;
        
        if (selectedAtleta?.sexo === 'Femenino' && pesoObjetivoKg < 40) {
            toast({
                title: "Error de Validación",
                description: "Para atletas femeninas, el peso objetivo no puede ser menor de 40 kg.",
                variant: "destructive",
            });
            return;
        }

        setIsGenerating(true);
        try {
            const dataToSend = {
                ...formData,
                peso_actual: unit === 'kg' ? formData.peso_actual : formData.peso_actual / KG_TO_LB,
                peso_objetivo: pesoObjetivoKg,
            };

            const response = await fetch(API_ENDPOINTS.IA.GENERATE_DIET_PLAN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });
            if (!response.ok) throw new Error("La IA no pudo generar el plan.");
            toast({ title: "Plan Generado", description: "El nuevo plan de alimentación ha sido creado." });
            onPlanGenerated();
            onClose();
        } catch (error) {
            toast({ title: "Error de Generación", description: "No se pudo generar el plan.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Generar Plan de Alimentación con IA</DialogTitle>
                    <DialogDescription>Define los parámetros para que la IA cree un plan nutricional a medida.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleGenerate} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label>Atleta *</Label>
                            <Select onValueChange={handleAtletaChange} required>
                                <SelectTrigger><SelectValue placeholder="Seleccionar atleta..." /></SelectTrigger>
                                <SelectContent>{atletas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre_completo}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Objetivo</Label>
                            <Select value={formData.objetivo} onValueChange={v => setFormData(p => ({...p, objetivo: v}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Definición">Definición (Bajar peso)</SelectItem>
                                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                                    <SelectItem value="Volumen">Volumen (Subir peso)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Nivel de Actividad</Label>
                            <Select value={formData.actividad_nivel} onValueChange={v => setFormData(p => ({...p, actividad_nivel: v}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Sedentario">Sedentario</SelectItem>
                                  <SelectItem value="Ligero">Ligero</SelectItem>
                                  <SelectItem value="Moderado">Moderado</SelectItem>
                                  <SelectItem value="Intenso">Intenso</SelectItem>
                                  <SelectItem value="Muy Intenso">Muy Intenso</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Peso Actual ({unit})</Label>
                            <Input type="number" step="0.1" value={formData.peso_actual} onChange={e => setFormData(p => ({...p, peso_actual: parseFloat(e.target.value) || 0}))} maxLength={5} />
                        </div>
                        <div className="space-y-2">
                            <Label>Peso Objetivo ({unit})</Label>
                            <Input type="number" step="0.1" value={formData.peso_objetivo} onChange={e => setFormData(p => ({...p, peso_objetivo: parseFloat(e.target.value) || 0}))} maxLength={5} />
                        </div>
                        <div className="col-span-2 flex justify-end">
                            <Button type="button" variant="link" onClick={toggleUnit}>Cambiar a {unit === 'kg' ? 'lb' : 'kg'}</Button>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Restricciones o Alergias (separadas por coma)</Label>
                            <Textarea value={formData.restricciones} onChange={e => setFormData(p => ({...p, restricciones: e.target.value}))} placeholder="Ej: Lactosa, gluten, maní..." />
                        </div>
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