"use client"

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Loader2, Eye, MoreHorizontal, UserCheck, UserX, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api-config";
import { generatePdfReport } from "@/lib/report-generator";
import { generateEntrenadoresPdfReport } from "@/lib/report-generator";
import { ConfirmationDialog } from "@/components/reusable/confirmation-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
const asociaciones = ["Alta Verapaz", "Chimaltenango", "Escuintla", "Guatemala", "Huehuetenango", "Jalapa", "Quiché", "Sacatepéquez", "San Marcos", "Sololá", "Sin Asociación"];

interface Entrenador {
  id: string;
  nombre_completo: string; // La API devuelve nombre_completo
  id_usuario?: string; // Necesario para activar/desactivar
  email: string;
  telefono?: string;
  asociacion_departamental?: string;
  experiencia?: number;
  certificaciones?: string[];
  especialidades?: string[];
  activo: boolean;
  // Campos que pueden no venir en la lista pero sí en el detalle
  nombre?: string;
  apellido?: string;
}

interface EntrenadorDialogProps { 
    isOpen: boolean; 
    onClose: () => void; 
    entrenador: Entrenador | null; 
    onSave: (data: Partial<Entrenador>) => void; 
}

export default function EntrenadoresPage() {
    const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEntrenador, setEditingEntrenador] = useState<Entrenador | null>(null);
    const [entrenadorParaEliminar, setEntrenadorParaEliminar] = useState<Entrenador | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    const fetchEntrenadores = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.ENTRENADORES.LIST);
            if (!response.ok) throw new Error("Error al cargar entrenadores");
            setEntrenadores(await response.json());
        } catch (error) {
            toast({ title: "Error de Carga", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchEntrenadores(); }, [fetchEntrenadores]);

    const filteredEntrenadores = React.useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        return entrenadores.filter(e =>
            e.nombre_completo.toLowerCase().includes(lowercasedFilter) ||
            e.email.toLowerCase().includes(lowercasedFilter));
    }, [entrenadores, searchTerm]);

    const handleSaveEntrenador = async (data: Partial<Entrenador>) => {
        const isEditing = !!editingEntrenador;
        
        // --- INICIO CORRECCIÓN: Preparar datos para la API ---
        const dataToSend = { ...data };
        if (data.nombre && data.apellido) {
            dataToSend.nombre_completo = `${data.nombre} ${data.apellido}`;
        }
        // Asegurarse que la experiencia sea un número
        dataToSend.experiencia = data.experiencia ? Number(data.experiencia) : 0;
        // --- FIN CORRECCIÓN ---

        const url = isEditing ? API_ENDPOINTS.ENTRENADORES.UPDATE(editingEntrenador!.id) : API_ENDPOINTS.ENTRENADORES.CREATE;
        const method = isEditing ? 'PUT' : 'POST';
        let response: Response | undefined;

        try {
            response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend) });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Error al guardar");
            }

            if (isEditing) {
                toast({ title: "Entrenador actualizado" });
            } else {
                toast({
                    title: "Entrenador Creado",
                    description: "El entrenador ha sido creado con éxito. Se han enviado sus credenciales por correo."
                });
            }

            setIsDialogOpen(false);
            fetchEntrenadores();
            
            if (isEditing) {
                setEntrenadores(prev => prev.map(e => e.id === editingEntrenador!.id ? { ...e, ...dataToSend } : e));
            }

        } catch (error: any) {
            toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
            // Si el error es por email duplicado, el mensaje ya viene de la API.
            if (response?.status === 409) {
                return; // Evita mostrar un toast genérico si ya mostramos el específico.
            }
        }
    };

    const handleToggleEntrenador = async (entrenadorId: string, activo: boolean) => {
        try {
            const res = await fetch(`/api/entrenadores/${entrenadorId}/toggle-activation`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activo }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || (activo ? 'Error al activar' : 'Error al desactivar'));
            }
            toast({ title: `Entrenador ${activo ? 'activado' : 'desactivado'}` });
            fetchEntrenadores();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const confirmDelete = async () => {
        if (!entrenadorParaEliminar) return;
        try {
            await fetch(API_ENDPOINTS.ENTRENADORES.DELETE(entrenadorParaEliminar.id), { method: 'DELETE' });
            toast({ title: "Entrenador eliminado" });
            setEntrenadorParaEliminar(null);
            fetchEntrenadores();
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }

    // --- CORRECCIÓN DEFINITIVA: Adaptar la generación de reportes al sistema unificado ---
    const generateEntrenadoresReport = () => {
        if (filteredEntrenadores.length === 0) {
            toast({ title: "No hay datos para exportar", variant: "destructive" });
            return;
        }

        // Usar toast.promise para una mejor UX
        toast({ title: "Generando reporte...", description: "La descarga comenzará en breve." });
        // Usamos la nueva función específica para entrenadores
        generateEntrenadoresPdfReport(filteredEntrenadores, "Reporte General de Entrenadores").catch(err => toast({ title: "Error al generar PDF", description: err.message, variant: "destructive" }));
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div><h2 className="text-3xl font-bold tracking-tight">Entrenadores</h2><p className="text-muted-foreground">Gestiona los entrenadores del sistema.</p></div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={generateEntrenadoresReport}><FileText className="mr-2 h-4 w-4" /> Exportar PDF</Button>
                    <Button onClick={() => { setEditingEntrenador(null); setIsDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Nuevo Entrenador</Button>
                </div>
            </div>
            <Card>
                <CardHeader><CardTitle>Lista de Entrenadores</CardTitle></CardHeader>
                <CardContent>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                        <Table>
                            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Asociación</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {filteredEntrenadores.map((entrenador) => (
                                    <TableRow key={entrenador.id}>
                                        <TableCell className="font-medium">{entrenador.nombre_completo}</TableCell>
                                        <TableCell>{entrenador.email}</TableCell>
                                        <TableCell>{entrenador.asociacion_departamental}</TableCell>
                                        <TableCell>
                                            <Badge variant={entrenador.activo ? 'default' : 'outline'}>
                                                {entrenador.activo ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menú</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.push(`/entrenadores/${entrenador.id}`)}><Eye className="mr-2 h-4 w-4" />Ver Detalles</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => { setEditingEntrenador(entrenador); setIsDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                                                    {entrenador.activo ? (
                                                        <DropdownMenuItem onClick={() => handleToggleEntrenador(entrenador.id, false)} className="text-yellow-600"><UserX className="mr-2 h-4 w-4" />Desactivar</DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleToggleEntrenador(entrenador.id, true)} className="text-green-600"><UserCheck className="mr-2 h-4 w-4" />Activar</DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => setEntrenadorParaEliminar(entrenador)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
            <EntrenadorDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} entrenador={editingEntrenador} onSave={handleSaveEntrenador} />
            <ConfirmationDialog 
                isOpen={!!entrenadorParaEliminar} 
                onClose={() => setEntrenadorParaEliminar(null)} 
                onConfirm={confirmDelete} 
                title="¿Estás seguro de eliminar a este entrenador?"
                description={`Esta acción no se puede deshacer. Se eliminará permanentemente a ${entrenadorParaEliminar?.nombre_completo}.`}
            />
        </div>
    );
}

function EntrenadorDialog({ isOpen, onClose, entrenador, onSave }: EntrenadorDialogProps) {
    const [formData, setFormData] = useState({
        nombre: "", apellido: "", email: "", telefono: "",
        asociacion_departamental: "Guatemala", experiencia: 0, certificaciones: "", especialidades: "", activo: true
    });

    useEffect(() => {
        if (isOpen) {
            if (entrenador) {
                const [nombre = '', ...apellidoParts] = (entrenador.nombre_completo || '').split(' ');
                const apellido = apellidoParts.join(' ');
                setFormData({
                    nombre: entrenador.nombre || nombre,
                    apellido: entrenador.apellido || apellido,
                    email: entrenador.email || "",
                    telefono: entrenador.telefono || "",
                    asociacion_departamental: entrenador.asociacion_departamental || "Guatemala",
                    experiencia: entrenador.experiencia || 0,
                    certificaciones: Array.isArray(entrenador.certificaciones) ? entrenador.certificaciones.join(', ') : '',
                    especialidades: Array.isArray(entrenador.especialidades) ? entrenador.especialidades.join(', ') : '',
                    activo: entrenador.activo !== undefined ? entrenador.activo : true,
                });
            } else {
                setFormData({
                    nombre: "", apellido: "", email: "", telefono: "",
                    asociacion_departamental: "Guatemala", experiencia: 0, certificaciones: "", especialidades: "", activo: true
                });
            }
        }
    }, [entrenador, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };
    
    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, asociacion_departamental: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            certificaciones: formData.certificaciones.split(',').map(item => item.trim()).filter(Boolean),
            especialidades: formData.especialidades.split(',').map(item => item.trim()).filter(Boolean),
            experiencia: Number(formData.experiencia) || 0,
        };
        onSave(dataToSave);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{entrenador ? "Editar Entrenador" : "Nuevo Entrenador"}</DialogTitle>
                    <DialogDescription>
                        {entrenador ? "Actualiza los datos del entrenador." : "Completa el formulario para crear un nuevo entrenador."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="nombre">Nombre *</Label><Input id="nombre" value={formData.nombre} onChange={handleChange} required /></div>
                        <div className="space-y-2"><Label htmlFor="apellido">Apellido *</Label><Input id="apellido" value={formData.apellido} onChange={handleChange} required /></div>
                        <div className="space-y-2 md:col-span-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={formData.email} onChange={handleChange} required /></div>
                        <div className="space-y-2"><Label htmlFor="telefono">Teléfono</Label><Input id="telefono" value={formData.telefono} onChange={handleChange} /></div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="asociacion">Asociación</Label>
                            <Select value={formData.asociacion_departamental} onValueChange={handleSelectChange}>
                                <SelectTrigger id="asociacion"><SelectValue placeholder="Selecciona una asociación" /></SelectTrigger>
                                <SelectContent>{asociaciones.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2"><Label htmlFor="experiencia">Experiencia (años)</Label><Input id="experiencia" type="number" value={formData.experiencia} onChange={e => setFormData(p => ({ ...p, experiencia: parseInt(e.target.value) || 0 }))} /></div>
                        <div className="space-y-2 md:col-span-2"><Label htmlFor="especialidades">Especialidades (separadas por coma)</Label><Input id="especialidades" value={formData.especialidades} onChange={handleChange} /></div>
                        <div className="space-y-2 md:col-span-2"><Label htmlFor="certificaciones">Certificaciones (separadas por coma)</Label><Input id="certificaciones" value={formData.certificaciones} onChange={handleChange} /></div>
                        {entrenador && (
                            <div className="flex items-center space-x-2 md:col-span-2">
                                <Switch id="activo" checked={formData.activo} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activo: checked }))} />
                                <Label htmlFor="activo">
                                    {formData.activo ? "Entrenador Activo" : "Entrenador Inactivo"}
                                </Label>
                            </div>
                        )}
                    </div>
                    <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">{entrenador ? 'Actualizar' : 'Crear'}</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
