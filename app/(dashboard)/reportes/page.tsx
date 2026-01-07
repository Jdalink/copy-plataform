"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; // Import completo
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label'; // Import Label
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, CalendarValue } from '@/components/ui/calendar';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, TrendingUp, FileDown, CalendarIcon } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { API_ENDPOINTS } from '@/lib/api-config';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Atleta } from '@/lib/definitions';
import { useSession } from 'next-auth/react';

interface ReportData {
    atleta_id: string;
    nombre_atleta: string;
    entrenamientos_planificados: number;
    entrenamientos_completados: number;
    porcentaje_adherencia: number;
}

export default function ReportesPage() {
    const [atletas, setAtletas] = useState<Atleta[]>([]);
    const [selectedAtletaId, setSelectedAtletaId] = useState<string>('todos');
    const [dateRange, setDateRange] = useState<CalendarValue>(null);
    const [reportData, setReportData] = useState<ReportData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingAtletas, setIsLoadingAtletas] = useState(true);
    const { data: session } = useSession();

    const fetchAtletas = useCallback(async () => {
        setIsLoadingAtletas(true);
        try {
            // --- INICIO CORRECCIÓN: Usar el endpoint correcto según el rol ---
            const isEntrenador = session?.user?.role === 'Entrenador';
            const endpoint = isEntrenador 
              ? API_ENDPOINTS.ENTRENADORES.GET_MY_ATLETAS 
              : API_ENDPOINTS.ATLETAS.LIST;

            const res = await fetch(endpoint);
            if (!res.ok) throw new Error('No se pudieron cargar los atletas');
            const data: Atleta[] = await res.json();
            setAtletas(data.filter(a => a.activo)); // Mantener solo atletas activos en el selector
        } catch (error: any) { toast.error(error.message || 'Error cargando atletas'); }
        finally { setIsLoadingAtletas(false); }
    }, [session]);

    useEffect(() => { if (session) fetchAtletas(); }, [fetchAtletas, session]);

    const handleGenerateReport = async () => {
        const from = Array.isArray(dateRange) && dateRange[0] ? dateRange[0] : null;
        const to = Array.isArray(dateRange) && dateRange[1] ? dateRange[1] : null;

        if (!selectedAtletaId) {
            toast.warning('Por favor, selecciona un atleta.');
            return;
        }

        if (!from || !to) {
            toast.warning('Por favor, selecciona un rango de fechas válido.');
            return;
        }
        
        setIsLoading(true);
        setReportData([]);

        try {
            const params = new URLSearchParams({
                fecha_inicio: format(from, 'yyyy-MM-dd'),
                fecha_fin: format(to, 'yyyy-MM-dd')
            });
            if (selectedAtletaId !== 'todos') {
                params.append('atleta_id', selectedAtletaId);
            }
            
            const res = await fetch(`${API_ENDPOINTS.REPORTES.ADHERENCIA}?${params.toString()}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Error al generar el reporte');
            }
            
            const data: ReportData[] = await res.json();
            setReportData(data);
            if (data.length === 0) {
                toast.info("No se encontraron datos para los filtros seleccionados.");
            }
        } catch (error: any) {
            toast.error('Error al generar el reporte', { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = (formatType: 'pdf' | 'excel') => {
        if (reportData.length === 0) {
            toast.warning("No hay datos para exportar.");
            return;
        }

        const athleteName = selectedAtletaId === 'todos' ? 'todos_los_atletas' : atletas.find(a => a.id === selectedAtletaId)?.nombre_completo.replace(/\s+/g, '_') || 'atleta_desconocido';
        const [from, to] = Array.isArray(dateRange) ? dateRange : [null, null];
        const datePart = from && to ? `${format(from, 'yyyy-MM-dd')}_a_${format(to, 'yyyy-MM-dd')}` : 'rango_no_especificado';
        const fileName = `Reporte_Adherencia_${athleteName}_${datePart}`;

        const headers = [['Atleta', 'Entrenamientos Planificados', 'Entrenamientos Completados', 'Porcentaje de Adherencia (%)']];
        const body = reportData.map(d => [d.nombre_atleta, d.entrenamientos_planificados, d.entrenamientos_completados, d.porcentaje_adherencia.toFixed(2)]);

        if (formatType === 'pdf') {
            const doc = new jsPDF();
            doc.text(`Reporte de Adherencia - ${new Date().toLocaleDateString('es-GT')}`, 14, 16);
            autoTable(doc, {
                head: headers,
                body: body,
                startY: 20,
            });
            doc.save(`${fileName}.pdf`);
            toast.success("Reporte en PDF generado exitosamente.");
        } else {
            const worksheet = XLSX.utils.aoa_to_sheet([...headers, ...body]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Adherencia');
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
            toast.success("Reporte en Excel generado exitosamente.");
        }
    };

    // --- INICIO CORRECCIÓN: Tipar 'item' ---
    const chartData = reportData.map((item: ReportData) => ({
    // --- FIN CORRECCIÓN ---
        name: item.nombre_atleta.split(' ')[0], // Usar solo primer nombre
        Planificados: item.entrenamientos_planificados,
        Completados: item.entrenamientos_completados,
    }));

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Reportes de Entrenamientos</h2>
                    <p className="text-muted-foreground">Analiza la finalización de entrenamientos.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                     <Button onClick={() => handleExport('pdf')} disabled={reportData.length === 0 || isLoading} size="sm"><FileDown className="mr-2 h-4 w-4" />PDF</Button>
                     <Button onClick={() => handleExport('excel')} disabled={reportData.length === 0 || isLoading} size="sm"><FileDown className="mr-2 h-4 w-4" />Excel</Button>
                </div>
            </div>

            <Card>
                <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        {/* --- INICIO CORRECCIÓN: Usar Label --- */}
                        <Label htmlFor="select-atleta">Atleta</Label>
                        {/* --- FIN CORRECCIÓN --- */}
                        <Select value={selectedAtletaId} onValueChange={setSelectedAtletaId} disabled={isLoadingAtletas}>
                            <SelectTrigger id="select-atleta">
                                <SelectValue placeholder={isLoadingAtletas ? "Cargando..." : "Seleccione"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos los Atletas Activos</SelectItem>
                                {/* --- INICIO CORRECCIÓN: Tipar 'atleta' --- */}
                                {atletas.map((atleta: Atleta) => (
                                // --- FIN CORRECCIÓN ---
                                    <SelectItem key={atleta.id} value={atleta.id}>{atleta.nombre_completo}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                         {/* --- INICIO CORRECCIÓN: Usar Label --- */}
                        <Label>Rango de Fechas *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !Array.isArray(dateRange) && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {Array.isArray(dateRange) && dateRange[0] && dateRange[1] ? (
                                        <>
                                            {format(dateRange[0], "dd LLL, y", { locale: es })} -{" "}
                                            {format(dateRange[1], "dd LLL, y", { locale: es })}
                                        </>
                                    ) : (
                                        <span>Selecciona un rango</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar value={dateRange} onChange={(value) => setDateRange(value)} selectRange={true} />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleGenerateReport} disabled={isLoading || !Array.isArray(dateRange) || !dateRange[0] || !dateRange[1]}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generar
                    </Button>
                </CardFooter>
            </Card>

            {isLoading && (<div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>)}

            {!isLoading && reportData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><TrendingUp className="mr-2" /> Resultados de Adherencia</CardTitle>
                        <CardDescription>Comparativa de entrenamientos planificados vs. completados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="Planificados" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="Completados" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
             {!isLoading && reportData.length === 0 && !isLoadingAtletas && Array.isArray(dateRange) && dateRange[0] && dateRange[1] && (
                 <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">No se encontraron datos.</p></CardContent></Card>
             )}
        </div>
    );
}

// --- INICIO CORRECCIÓN: Tipado explícito para las props del Tooltip ---
interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                <p className="font-bold text-foreground">{label}</p>
                {payload.map((pld, index) => (
                    <p key={index} style={{ color: pld.color }}>
                        {`${pld.name}: ${pld.value}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};
// --- FIN CORRECCIÓN ---
