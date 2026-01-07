"use client"

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api-config";
import { Switch } from "@/components/ui/switch";

// --- INTERFACES ---
interface Atleta { id: string; nombre_completo: string; }
interface Ejercicio { nombre: string; series: string; reps: string; peso: string; unidades_peso: 'kg' | 'lb'; }
interface Entrenamiento {
  id: string;
  atleta_id: string;
  nombre_atleta?: string;
  fecha: string;
  tipo_entrenamiento: string;
  intensidad: 'Baja' | 'Media' | 'Alta';
  completado: boolean;
  ejercicios: Ejercicio[];
}

export default function EntrenamientosPage() {
    const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([]);
    const [atletas, setAtletas] = useState<Atleta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEntrenamiento, setEditingEntrenamiento] = useState<Entrenamiento | null>(null);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [entrenamientosRes, atletasRes] = await Promise.all([
                fetch(API_ENDPOINTS.ENTRENAMIENTOS.LIST),
                fetch(API_ENDPOINTS.ATLETAS.LIST)
            ]);
            if (!entrenamientosRes.ok || !atletasRes.ok) throw new Error("Error al cargar datos");

            const entrenamientosData = await entrenamientosRes.json();
            const atletasData = await atletasRes.json();

            // Aseguramos que el nombre del atleta se muestre correctamente
            setEntrenamientos(entrenamientosData);
            setAtletas(atletasData);
        } catch (error) {
            toast({ title: "Error de Carga", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (data: Partial<Entrenamiento>) => {
        const isEditing = !!editingEntrenamiento;
        const url = isEditing ? API_ENDPOINTS.ENTRENAMIENTOS.UPDATE(editingEntrenamiento.id) : API_ENDPOINTS.ENTRENAMIENTOS.CREATE;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`Error al ${isEditing ? 'actualizar' : 'crear'} el entrenamiento`);
            toast({ title: `Entrenamiento ${isEditing ? 'actualizado' : 'creado'} con éxito` });
            setIsDialogOpen(false);
            setEditingEntrenamiento(null);
            fetchData();
        } catch (error) {
            toast({ title: "Error al guardar", variant: "destructive" });
        }
    };
    
    const handleUpdateStatus = async (entrenamientoId: string, completado: boolean) => {
        try {
            const response = await fetch(API_ENDPOINTS.ENTRENAMIENTOS.UPDATE(entrenamientoId), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completado })
            });
            if (!response.ok) throw new Error("Error al actualizar el estado");
            toast({ title: "Estado actualizado" });
            fetchData();
        } catch (error) {
            toast({ title: "Error al actualizar", variant: "destructive" });
        }
    };

    const openCreateDialog = () => {
        setEditingEntrenamiento(null);
        setIsDialogOpen(true);
    };

    const openEditDialog = (entrenamiento: Entrenamiento) => {
        setEditingEntrenamiento(entrenamiento);
        setIsDialogOpen(true);
    };

    if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;

    return (
        <div className="flex-1 space-y-4 p-4 md-p-8 pt-6">
            <div className="flex items-center justify-between">
                <div><h2 className="text-3xl font-bold tracking-tight">Seguimiento de Entrenamientos</h2><p className="text-muted-foreground">Asigna y monitorea los entrenamientos diarios de los atletas.</p></div>
                <Button onClick={openCreateDialog}><Plus className="mr-2 h-4 w-4" /> Nuevo Entrenamiento</Button>
            </div>
            <Card>
                <CardHeader><CardTitle>Entrenamientos Asignados</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {entrenamientos.map(entrenamiento => (
                            <Card key={entrenamiento.id} className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{entrenamiento.nombre_atleta}</p>
                                        <p className="text-sm text-muted-foreground">{entrenamiento.tipo_entrenamiento} - {new Date(entrenamiento.fecha).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(entrenamiento)}><Edit className="h-4 w-4" /></Button>
                                        <Label htmlFor={`status-${entrenamiento.id}`}>{entrenamiento.completado ? "Completado" : "Pendiente"}</Label>
                                        <Switch id={`status-${entrenamiento.id}`} checked={entrenamiento.completado} onCheckedChange={(checked) => handleUpdateStatus(entrenamiento.id, checked)} />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {Array.isArray(entrenamiento.ejercicios) && entrenamiento.ejercicios.map((ej, index) => (
                                        <div key={index} className="text-sm flex justify-between border-b last:border-b-0 py-1">
                                            <span>{ej.nombre}</span>
                                            <span className="text-muted-foreground">{ej.series} series x {ej.reps} reps con {ej.peso} {ej.unidades_peso}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <EntrenamientoDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} atletas={atletas} onSave={handleSave} entrenamiento={editingEntrenamiento} />
        </div>
    );
}

// --- DIÁLOGO DE ENTRENAMIENTO MEJORADO ---
interface EntrenamientoDialogProps {
    isOpen: boolean;
    onClose: () => void;
    atletas: Atleta[];
    onSave: (data: Partial<Entrenamiento>) => void;
    entrenamiento: Entrenamiento | null;
}

function EntrenamientoDialog({ isOpen, onClose, atletas, onSave, entrenamiento }: EntrenamientoDialogProps) {
    const [formData, setFormData] = useState<Partial<Entrenamiento>>({
        atleta_id: '',
        fecha: new Date().toISOString().split('T')[0],
        tipo_entrenamiento: '',
        intensidad: 'Media',
        ejercicios: [{ nombre: '', series: '', reps: '', peso: '', unidades_peso: 'kg' }]
    });

    useEffect(() => {
        if (isOpen) {
            if (entrenamiento) {
                // Modo Edición: Cargar datos del entrenamiento
                setFormData({
                    ...entrenamiento,
                    fecha: new Date(entrenamiento.fecha).toISOString().split('T')[0],
                    ejercicios: entrenamiento.ejercicios || [{ nombre: '', series: '', reps: '', peso: '', unidades_peso: 'kg' }]
                });
            } else {
                // Modo Creación: Resetear formulario
                setFormData({
                    atleta_id: '',
                    fecha: new Date().toISOString().split('T')[0],
                    tipo_entrenamiento: '',
                    intensidad: 'Media',
                    ejercicios: [{ nombre: '', series: '', reps: '', peso: '', unidades_peso: 'kg' }]
                });
            }
        }
    }, [entrenamiento, isOpen]);

    const handleEjercicioChange = (index: number, field: keyof Ejercicio, value: string) => {
        const newEjercicios = [...(formData.ejercicios || [])];
        const ejercicio = { ...newEjercicios[index] };

        // Validar que solo se ingresen números en campos numéricos
        if (field === 'series' || field === 'reps' || field === 'peso') {
            const numericValue = value.replace(/[^0-9.]/g, '');
            (ejercicio[field] as any) = numericValue;
        } else {
            (ejercicio[field] as any) = value;
        }
        newEjercicios[index] = ejercicio;
        setFormData(prev => ({...prev, ejercicios: newEjercicios}));
    };

    const addEjercicio = () => setFormData(prev => ({...prev, ejercicios: [...(prev.ejercicios || []), { nombre: '', series: '', reps: '', peso: '', unidades_peso: 'kg' }]}));
    const removeEjercicio = (index: number) => setFormData(prev => ({...prev, ejercicios: prev.ejercicios?.filter((_, i) => i !== index)}));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader><DialogTitle>{entrenamiento ? "Editar Entrenamiento" : "Nuevo Entrenamiento"}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Atleta *</Label><Select value={formData.atleta_id} onValueChange={(v) => setFormData(p => ({...p, atleta_id: v}))} required disabled={!!entrenamiento}><SelectTrigger><SelectValue placeholder="Selecciona un atleta" /></SelectTrigger><SelectContent>{atletas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre_completo}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Fecha *</Label><Input type="date" value={formData.fecha} onChange={e => setFormData(p => ({...p, fecha: e.target.value}))} required /></div>
                        <div className="space-y-2"><Label>Tipo de Entrenamiento *</Label><Input placeholder="Ej: Día de Pecho" value={formData.tipo_entrenamiento} onChange={e => setFormData(p => ({...p, tipo_entrenamiento: e.target.value}))} required /></div>
                        <div className="space-y-2"><Label>Intensidad</Label><Select value={formData.intensidad} onValueChange={(v) => setFormData(p => ({...p, intensidad: v as any}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Baja">Baja</SelectItem><SelectItem value="Media">Media</SelectItem><SelectItem value="Alta">Alta</SelectItem></SelectContent></Select></div>
                    </div>
                    <div>
                        <Label className="text-lg font-semibold">Ejercicios</Label>
                        <div className="space-y-2 mt-2">
                            {formData.ejercicios?.map((ej, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                    <Input placeholder="Nombre Ejercicio" value={ej.nombre} onChange={e => handleEjercicioChange(index, 'nombre', e.target.value)} className="col-span-4" />
                                    <Input type="number" placeholder="Series" value={ej.series} onChange={e => handleEjercicioChange(index, 'series', e.target.value)} className="col-span-1" />
                                    <Input type="number" placeholder="Reps" value={ej.reps} onChange={e => handleEjercicioChange(index, 'reps', e.target.value)} className="col-span-1" />
                                    <Input type="number" step="0.01" placeholder="Peso" value={ej.peso} onChange={e => handleEjercicioChange(index, 'peso', e.target.value)} className="col-span-2" />
                                    <Select value={ej.unidades_peso} onValueChange={v => handleEjercicioChange(index, 'unidades_peso', v)}><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="kg">kg</SelectItem><SelectItem value="lb">lb</SelectItem></SelectContent></Select>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEjercicio(index)} className="col-span-1 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addEjercicio} className="mt-2">Añadir Ejercicio</Button>
                    </div>
                    <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={!formData.atleta_id}>Guardar Cambios</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}