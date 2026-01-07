"use client"

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api-config";
import { Badge } from "@/components/ui/badge";

interface RankingEntry {
  nombre_completo: string;
  pais: string;
  categoria_peso: string;
  total: number;
  ipf_gl_points: number; // Corregido para usar IPF GL Points
  competencia: string;
  fecha: string;
}

export default function RankingsPage() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ genero: 'all', categoria_peso: 'all' });
  const { toast } = useToast();

  const fetchRankings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${API_ENDPOINTS.RANKINGS.GET}?${params.toString()}`);
      if (!response.ok) throw new Error("Error al cargar los rankings");
      const data = await response.json();
      setRankings(data);
    } catch (error) {
      toast({ title: "Error de Carga", description: "No se pudieron cargar los rankings.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, filters]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rankings Oficiales</h2>
          <p className="text-muted-foreground">Clasificaciones basadas en los resultados de las competencias.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Ranking</CardTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <Select value={filters.genero} onValueChange={(v) => handleFilterChange('genero', v)}>
              <SelectTrigger><SelectValue placeholder="Género..." /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos los Géneros</SelectItem><SelectItem value="M">Masculino</SelectItem><SelectItem value="F">Femenino</SelectItem></SelectContent>
            </Select>
            <Select value={filters.categoria_peso} onValueChange={(v) => handleFilterChange('categoria_peso', v)}>
              <SelectTrigger><SelectValue placeholder="Categoría..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Categorías</SelectItem>
                <SelectItem value="59kg">59kg</SelectItem><SelectItem value="66kg">66kg</SelectItem><SelectItem value="74kg">74kg</SelectItem><SelectItem value="83kg">83kg</SelectItem>
                <SelectItem value="93kg">93kg</SelectItem><SelectItem value="105kg">105kg</SelectItem><SelectItem value="120kg">120kg</SelectItem><SelectItem value="+120kg">+120kg</SelectItem>
                <SelectItem value="47kg">47kg (F)</SelectItem><SelectItem value="52kg">52kg (F)</SelectItem><SelectItem value="57kg">57kg (F)</SelectItem><SelectItem value="63kg">63kg (F)</SelectItem>
                <SelectItem value="69kg">69kg (F)</SelectItem><SelectItem value="76kg">76kg (F)</SelectItem><SelectItem value="84kg">84kg (F)</SelectItem><SelectItem value="+84kg">+84kg (F)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center p-8"><Loader2 className="h-12 w-12 animate-spin" /></div> : (
            <Table>
              <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Atleta</TableHead><TableHead>Categoría</TableHead><TableHead>Total</TableHead><TableHead>Puntos IPF GL</TableHead><TableHead>Competencia</TableHead></TableRow></TableHeader>
              <TableBody>
                {rankings.map((r, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-bold">{index + 1}</TableCell>
                    <TableCell>{r.nombre_completo} <Badge variant="outline">{r.pais}</Badge></TableCell>
                    <TableCell>{r.categoria_peso}</TableCell>
                    <TableCell>{r.total} kg</TableCell>
                    <TableCell className="font-semibold">{r.ipf_gl_points}</TableCell>
                    <TableCell>{r.competencia}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}