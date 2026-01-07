"use client"

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api-config";
import { ConfirmationDialog } from "@/components/reusable/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSession } from "next-auth/react";

// --- INTERFACES Y DATOS ---
interface CompetenciaCategoria {
  id?: string;
  competencia_id?: string;
  categoria_peso: string;
  categoria_edad: string;
  sexo: 'Femenino' | 'Masculino';
}
interface Competencia {
  id: string;
  nombre: string;
  fecha: string;
  fecha_fin?: string;
  ubicacion: string;
  tipo?: 'Nacional' | 'Internacional' | 'Regional' | 'Local';
  organizador?: string;
  descripcion?: string;
  estado: 'programada' | 'en_curso' | 'finalizada' | 'cancelada';
  max_participantes?: number;
  categorias?: CompetenciaCategoria[];
}

const categoriasEdad = ["Sub-Junior (14-18)", "Junior (19-23)", "Open (24-39)", "Master I (40-49)", "Master II (50-59)", "Master III (60-69)", "Master IV (70+)"];
const categoriasPesoMasculino = ["-59 kg", "-66 kg", "-74 kg", "-83 kg", "-93 kg", "-105 kg", "-120 kg", "+120 kg"];
const categoriasPesoFemenino = ["-47 kg", "-52 kg", "-57 kg", "-63 kg", "-69 kg", "-76 kg", "-84 kg", "+84 kg"];

// --- COMPONENTE PRINCIPAL ---
export default function CompetenciasPage() {
    const [competencias, setCompetencias] = useState<Competencia[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { data: session } = useSession();
    const [editingCompetencia, setEditingCompetencia] = useState<Competencia | null>(null);
    const [competenciaParaEliminar, setCompetenciaParaEliminar] = useState<Competencia | null>(null);
    const [solicitando, setSolicitando] = useState<Record<string, boolean>>({});
    const [inscritos, setInscritos] = useState<any[]>([]);
    const [isIncritosDialogOpen, setIsInscritosDialogOpen] = useState(false);
    const [selectedCompetencia, setSelectedCompetencia] = useState<Competencia | null>(null);
    const { toast } = useToast();
    
    const userRole = session?.user?.role;
    const isAtleta = userRole === 'Atleta';
    const canManage = userRole === 'Administrador' || userRole === 'Gerencia';

    const handleSolicitarInscripcion = async (competenciaId: string) => {
        setSolicitando(prev => ({...prev, [competenciaId]: true}));
        try {
            const response = await fetch(API_ENDPOINTS.COMPETENCIAS.SOLICITAR_INSCRIPCION(competenciaId), { method: 'POST' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al procesar la solicitud.");
            }
            toast({ title: "Solicitud Enviada", description: "Tu entrenador ha sido notificado para aprobar tu inscripción." });
        } catch (error: any) {
            toast({ title: "Error en la Solicitud", description: error.message, variant: "destructive" });
        } finally {
            setSolicitando(prev => ({...prev, [competenciaId]: false}));
        }
    };

    const fetchCompetencias = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.COMPETENCIAS.LIST);
            if (!response.ok) throw new Error("Error al cargar las competencias");
            const data = await response.json();
            setCompetencias(data);
        } catch (error) {
            toast({ title: "Error de Carga", description: "No se pudieron cargar los datos.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchCompetencias(); }, [fetchCompetencias]);

    const handleSaveCompetencia = async (data: Partial<Competencia> & { categorias: CompetenciaCategoria[] }) => {
        const isEditing = !!editingCompetencia;
        const url = isEditing ? API_ENDPOINTS.COMPETENCIAS.UPDATE(editingCompetencia.id) : API_ENDPOINTS.COMPETENCIAS.CREATE;
        const method = isEditing ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al guardar");
            }
            toast({ title: `Competencia ${isEditing ? 'actualizada' : 'creada'}` });
            setIsDialogOpen(false);
            setEditingCompetencia(null);
            fetchCompetencias();
        } catch (error: any) {
            toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        }
    };
    
    const confirmDelete = async () => {
        if (!competenciaParaEliminar) return;
        try {
            await fetch(API_ENDPOINTS.COMPETENCIAS.DELETE(competenciaParaEliminar.id), { method: 'DELETE' });
            toast({ title: "Competencia eliminada" });
            setCompetenciaParaEliminar(null);
            fetchCompetencias();
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }

    const handleOpenInscritos = async (competencia: Competencia) => {
        setSelectedCompetencia(competencia);
        setIsInscritosDialogOpen(true);
        try {
            const response = await fetch(API_ENDPOINTS.COMPETENCIAS.LISTAR_INSCRITOS(competencia.id));
            if (!response.ok) throw new Error("No se pudieron cargar los inscritos.");
            const data = await response.json();
            setInscritos(data);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div><h2 className="text-3xl font-bold tracking-tight">Competencias</h2><p className="text-muted-foreground">Gestiona los eventos competitivos del sistema.</p></div>
                {canManage && <Button onClick={() => { setEditingCompetencia(null); setIsDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Nueva Competencia</Button>}
            </div>
            <Card>
                <CardHeader><CardTitle>Lista de Competencias</CardTitle></CardHeader>
                <CardContent>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                        <Table>
                            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Fecha</TableHead><TableHead>Ubicación</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {competencias.length > 0 ? competencias.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">{c.nombre}</TableCell>
                                        <TableCell>{new Date(c.fecha).toLocaleDateString()}</TableCell>
                                        <TableCell>{c.ubicacion}</TableCell>
                                        <TableCell><Badge>{c.estado}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            {isAtleta && c.estado === 'programada' && (
                                                <Button size="sm" onClick={() => handleSolicitarInscripcion(c.id)} disabled={solicitando[c.id]}>
                                                    {solicitando[c.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Solicitar Inscripción"}
                                                </Button>
                                            )}
                                            {canManage && (
                                                <>
                                                    <Button variant="outline" size="sm" onClick={() => handleOpenInscritos(c)}>Ver Inscritos</Button>
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingCompetencia(c); setIsDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setCompetenciaParaEliminar(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={5} className="text-center">No hay competencias registradas.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
            <CompetenciaDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} competencia={editingCompetencia} onSave={handleSaveCompetencia} />
            {selectedCompetencia && <InscritosDialog isOpen={isIncritosDialogOpen} onClose={() => setIsInscritosDialogOpen(false)} competencia={selectedCompetencia} inscritos={inscritos} />}
            <ConfirmationDialog isOpen={!!competenciaParaEliminar} onClose={() => setCompetenciaParaEliminar(null)} onConfirm={confirmDelete} title="¿Estás seguro de eliminar esta competencia?" description="Esta acción no se puede deshacer y eliminará todas las inscripciones asociadas."/>
        </div>
    );
}

// --- DIÁLOGO MEJORADO CON SCROLL ---
interface CompetenciaDialogProps { isOpen: boolean; onClose: () => void; competencia: Competencia | null; onSave: (data: Partial<Competencia> & { categorias: CompetenciaCategoria[] }) => void; }

function CompetenciaDialog({ isOpen, onClose, competencia, onSave }: CompetenciaDialogProps) {
    const [formData, setFormData] = useState<Partial<Competencia>>({});
    const [selectedCategorias, setSelectedCategorias] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            const initialData = competencia || {
                nombre: "", fecha: new Date().toISOString().split('T')[0], ubicacion: "",
                estado: "programada", tipo: "Nacional", organizador: "",
                descripcion: "", max_participantes: 100, categorias: []
            };
            setFormData(initialData);
            const initialCategorias = new Set(initialData.categorias?.map(c => `${c.sexo}-${c.categoria_edad}-${c.categoria_peso}`) || []);
            setSelectedCategorias(initialCategorias);
        }
    }, [competencia, isOpen]);
    
    const handleCategoriaChange = (sexo: string, edad: string, peso: string, checked: boolean) => {
        const newSet = new Set(selectedCategorias);
        const key = `${sexo}-${edad}-${peso}`;
        if (checked) newSet.add(key); else newSet.delete(key);
        setSelectedCategorias(newSet);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const categoriasParaGuardar = Array.from(selectedCategorias).map(key => {
            const [sexo, categoria_edad, categoria_peso] = key.split('-');
            return { sexo, categoria_edad, categoria_peso };
        });
        onSave({ ...formData, categorias: categoriasParaGuardar as CompetenciaCategoria[] });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    const handleSelectChange = (id: keyof Competencia, value: string) => setFormData(prev => ({ ...prev, [id]: value }));

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{competencia ? "Editar Competencia" : "Nueva Competencia"}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto -mx-6 px-6">
                    <form id="competencia-form" onSubmit={handleSubmit} className="space-y-6 pt-2 pb-6">
                        {/* --- Campos de la competencia --- */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2"><Label htmlFor="nombre">Nombre de la Competencia *</Label><Input id="nombre" value={formData.nombre || ""} onChange={handleChange} required /></div>
                            <div className="space-y-2"><Label htmlFor="fecha">Fecha de Inicio *</Label><Input id="fecha" type="date" value={formData.fecha ? new Date(formData.fecha).toISOString().split('T')[0] : ""} onChange={handleChange} required /></div>
                            <div className="space-y-2"><Label htmlFor="fecha_fin">Fecha de Fin</Label><Input id="fecha_fin" type="date" value={formData.fecha_fin ? new Date(formData.fecha_fin).toISOString().split('T')[0] : ""} onChange={handleChange} /></div>
                            <div className="space-y-2 md:col-span-2"><Label htmlFor="ubicacion">Ubicación *</Label><Input id="ubicacion" value={formData.ubicacion || ""} onChange={handleChange} required /></div>
                            <div className="space-y-2"><Label>Tipo</Label><Select value={formData.tipo} onValueChange={(v) => handleSelectChange('tipo', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Nacional">Nacional</SelectItem><SelectItem value="Internacional">Internacional</SelectItem><SelectItem value="Regional">Regional</SelectItem><SelectItem value="Local">Local</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label>Estado</Label><Select value={formData.estado} onValueChange={(v) => handleSelectChange('estado', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="programada">Programada</SelectItem><SelectItem value="en_curso">En Curso</SelectItem><SelectItem value="finalizada">Finalizada</SelectItem><SelectItem value="cancelada">Cancelada</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label htmlFor="max_participantes">Máximo de Participantes</Label><Input id="max_participantes" type="number" value={formData.max_participantes || ""} onChange={handleChange} /></div>
                            <div className="space-y-2"><Label htmlFor="organizador">Organizador</Label><Input id="organizador" value={formData.organizador || ""} onChange={handleChange} /></div>
                            <div className="space-y-2 md:col-span-2"><Label htmlFor="descripcion">Descripción</Label><Textarea id="descripcion" value={formData.descripcion || ""} onChange={handleChange} /></div>
                        </div>
                        
                        {/* --- Selector de Categorías --- */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold pt-4 border-t">Categorías Disponibles para Inscripción</h3>
                            <p className="text-sm text-muted-foreground">Selecciona todas las divisiones de edad y peso que estarán abiertas en este evento.</p>
                            <Accordion type="multiple" className="w-full" defaultValue={['masculino']}>
                                <AccordionItem value="masculino"><AccordionTrigger className="text-base font-medium">Masculino</AccordionTrigger><AccordionContent><CategorySelector sexo="Masculino" categoriasPeso={categoriasPesoMasculino} selected={selectedCategorias} onChange={handleCategoriaChange} /></AccordionContent></AccordionItem>
                                <AccordionItem value="femenino"><AccordionTrigger className="text-base font-medium">Femenino</AccordionTrigger><AccordionContent><CategorySelector sexo="Femenino" categoriasPeso={categoriasPesoFemenino} selected={selectedCategorias} onChange={handleCategoriaChange} /></AccordionContent></AccordionItem>
                            </Accordion>
                        </div>
                    </form>
                </div>
                <DialogFooter className="border-t pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" form="competencia-form">Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- DIÁLOGO DE INSCRITOS ---
interface InscritosDialogProps {
    isOpen: boolean;
    onClose: () => void;
    competencia: Competencia;
    inscritos: any[]; // Debería tener un tipo más específico
}

function InscritosDialog({ isOpen, onClose, competencia, inscritos }: InscritosDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Inscritos en {competencia.nombre}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Atleta</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inscritos.length > 0 ? inscritos.map(inscrito => (
                                <TableRow key={inscrito.id}>
                                    <TableCell>{inscrito.atleta_nombre}</TableCell>
                                    <TableCell>{`${inscrito.categoria_edad} / ${inscrito.categoria_peso}`}</TableCell>
                                    <TableCell><Badge>{inscrito.estado}</Badge></TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={3} className="text-center">No hay atletas inscritos.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CategorySelector({ sexo, categoriasPeso, selected, onChange }: { sexo: string, categoriasPeso: string[], selected: Set<string>, onChange: (sexo: string, edad: string, peso: string, checked: boolean) => void }) {
    return (
        <div className="space-y-4 pt-2">
            {categoriasEdad.map(edad => (
                <div key={edad}>
                    <h4 className="font-semibold text-sm mb-2 text-primary">{edad}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                        {categoriasPeso.map((peso: string) => {
                            const key = `${sexo}-${edad}-${peso}`;
                            return (
                                <div key={key} className="flex items-center space-x-2">
                                    <Checkbox id={key} checked={selected.has(key)} onCheckedChange={(checked) => onChange(sexo, edad, peso, !!checked)} />
                                    <Label htmlFor={key} className="text-sm font-normal cursor-pointer">{peso}</Label>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
