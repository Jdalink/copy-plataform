"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { API_ENDPOINTS } from "@/lib/api-config"

import { useSession } from "next-auth/react";

// --- INTERFACES ---
interface Resultado {
  id: string;
  total: number;
  ipf_gl_points: number;
  posicion: number;
  atleta_nombre: string;
  atleta_apellido: string;
  competencia_nombre: string;
  competencia_fecha: string;
}

interface Atleta { id: string; nombre_completo: string; }
interface Evento { id: string; evento_nombre: string; competencia_nombre: string; unidades_peso: 'kg' | 'lb' }

// --- COMPONENTE PRINCIPAL ---
export default function ResultadosPage() {
  const { data: session } = useSession();
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const userRole = session?.user?.role;
  const isAtleta = userRole === 'Atleta';
  const shouldShowRegistrarButton = userRole === 'Administrador' || userRole === 'Gerencia';

  const fetchResultados = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = isAtleta && session?.user?.id 
        ? API_ENDPOINTS.RESULTADOS.GET_BY_ATLETA(session.user.id)
        : API_ENDPOINTS.RESULTADOS.LIST;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error al cargar los resultados");
      const data = await response.json();
      setResultados(data);
    } catch (error) {
      toast({ title: "Error de Carga", description: "No se pudieron cargar los resultados.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, isAtleta, session?.user?.id]);

  useEffect(() => {
    fetchResultados();
  }, [fetchResultados]);

  const handleSave = async (data: any) => {
    try {
      const response = await fetch(API_ENDPOINTS.RESULTADOS.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al registrar el resultado");
      }
      toast({ title: "Resultado registrado con éxito" });
      setIsDialogOpen(false);
      fetchResultados();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Resultados</h2>
          <p className="text-muted-foreground">
            {isAtleta ? "Consulta aquí tus resultados oficiales de competencias." : "Consulta y registra los resultados de las competencias."}
          </p>
        </div>
        {shouldShowRegistrarButton && <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Registrar Resultado</Button>}
      </div>

      <Card>
        <CardHeader><CardTitle>Resultados Oficiales</CardTitle></CardHeader>
        <CardContent>
          {resultados.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Competencia</TableHead><TableHead>Atleta</TableHead><TableHead>Total (kg)</TableHead><TableHead>Puntos IPF GL</TableHead><TableHead>Posición</TableHead></TableRow></TableHeader>
              <TableBody>
                {resultados.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell>
                      <div className="font-medium">{res.competencia_nombre}</div>
                      <div className="text-sm text-muted-foreground">{new Date(res.competencia_fecha).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>{res.atleta_nombre} {res.atleta_apellido}</TableCell>
                    <TableCell className="font-bold">{res.total}</TableCell>
                    <TableCell>{res.ipf_gl_points}</TableCell>
                    <TableCell>#{res.posicion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              {isAtleta ? "Aún no tienes resultados registrados en competencias." : "No hay resultados para mostrar."}
            </div>
          )}
        </CardContent>
      </Card>

      <ResultadoDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSave={handleSave} />
    </div>
  );
}

// --- COMPONENTE DIALOG ---
interface ResultadoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

function ResultadoDialog({ isOpen, onClose, onSave }: ResultadoDialogProps) {
  const [competencias, setCompetencias] = useState<any[]>([]);
  const [selectedCompetencia, setSelectedCompetencia] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [atletasInscritos, setAtletasInscritos] = useState<Atleta[]>([]);
  const [isLoadingAtletas, setIsLoadingAtletas] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchCompetencias = async () => {
        const res = await fetch(API_ENDPOINTS.COMPETENCIAS.LIST);
        const data = await res.json();
        setCompetencias(data.filter((c: any) => c.estado === 'finalizada' || c.estado === 'en_curso'));
      };
      fetchCompetencias();
      setAtletasInscritos([]);
      setSelectedCompetencia(null);
      setFormData({});
    }
  }, [isOpen]);

  const handleCompetenciaChange = async (competenciaId: string) => {
    const competencia = competencias.find(c => c.id === competenciaId);
    setSelectedCompetencia(competencia || null);
    setAtletasInscritos([]);
    setIsLoadingAtletas(true);
    try {
      const res = await fetch(API_ENDPOINTS.COMPETENCIAS.LISTAR_INSCRITOS(competenciaId));
      if (!res.ok) throw new Error('No se pudieron cargar los atletas inscritos.');
      const atletas = await res.json();
      setAtletasInscritos(atletas.filter((a: any) => a.estado === 'aprobada'));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingAtletas(false);
    }
    setFormData((prev: any) => ({ ...prev, competencia_id: competenciaId, unidades_peso: 'kg' }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: any) => ({...prev, [e.target.id]: e.target.value}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader><DialogTitle>Registrar Resultado de Competencia</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Competencia *</Label>
              <Select onValueChange={handleCompetenciaChange} required>
                <SelectTrigger><SelectValue placeholder="Seleccionar competencia..."/></SelectTrigger>
                <SelectContent>
                  {competencias.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label>Atleta *</Label>
              <Select onValueChange={(v) => setFormData((p: any) => ({...p, atleta_id: v}))} required disabled={!selectedCompetencia || isLoadingAtletas}>
                <SelectTrigger><SelectValue placeholder={isLoadingAtletas ? "Cargando atletas..." : "Seleccionar atleta..."}/></SelectTrigger>
                <SelectContent>
                  {atletasInscritos.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre_completo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
                <Label>Peso Corporal (kg)</Label>
                <Input id="peso_corporal" type="number" step="0.1" onChange={handleChange} required/>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
            {[ 'sentadilla', 'press_banca', 'peso_muerto'].map(lift => (
                <div key={lift} className="space-y-2">
                  <h4 className="font-medium capitalize">{lift.replace('_', ' ')}</h4>
                  {[1, 2, 3].map(i => (
                      <Input key={i} id={`${lift}_${i}`} placeholder={`Intento ${i} (kg)`} type="number" step="0.5" onChange={handleChange}/>
                  ))}
                </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar Resultado</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}