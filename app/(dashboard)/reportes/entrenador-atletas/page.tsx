"use client";

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns'; // Ya existe
import { es } from 'date-fns/locale'; // Para formato en español
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BarChart, AlertTriangle, CalendarIcon } from 'lucide-react'; // Añadir CalendarIcon
import { API_ENDPOINTS } from '@/lib/api-config';
import { toast } from 'sonner';
import { Atleta } from '@/lib/definitions';
import { Label } from '@/components/ui/label';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Añadir Popover
import { CustomDayPickerCalendar as Calendar } from '@/components/ui/custom-day-picker-calendar'; // CORRECCIÓN: Usar el calendario correcto
import { cn } from '@/lib/utils'; // Añadir cn
import { Progress } from '@/components/ui/progress';

interface AdherenceData {
    totalEntrenamientos: number;
    entrenamientosCompletados: number;
    adherencia: number;
}

export default function ReporteAdherenciaPage() {
    const [atletas, setAtletas] = useState<Atleta[]>([]);
    const [selectedAtletaId, setSelectedAtletaId] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [adherenceData, setAdherenceData] = useState<AdherenceData | null>(null);
    const [isLoadingAtletas, setIsLoadingAtletas] = useState(true);
    const [isLoadingReporte, setIsLoadingReporte] = useState(false);

    useEffect(() => {
        const fetchAtletas = async () => {
            setIsLoadingAtletas(true);
            try {
                const response = await fetch(API_ENDPOINTS.ATLETAS.LIST);
                if (!response.ok) throw new Error("Error al cargar atletas");
                const data: Atleta[] = await response.json();
                setAtletas(data.filter(a => a.activo));
            } catch (error: any) {
                toast.error(error.message || "No se pudieron cargar los atletas.");
            } finally {
                setIsLoadingAtletas(false);
            }
        };
        fetchAtletas();
    }, []);

    const handleGenerateReport = async () => {
        if (!selectedAtletaId || !dateRange?.from || !dateRange?.to) {
            toast.warning("Por favor, selecciona un atleta y un rango de fechas completo.");
            return;
        }

        setIsLoadingReporte(true);
        setAdherenceData(null);

        try {
            const params = new URLSearchParams({
                atletaId: selectedAtletaId,
                fechaInicio: format(dateRange.from, 'yyyy-MM-dd'),
                fechaFin: format(dateRange.to, 'yyyy-MM-dd'),
            });

            const response = await fetch(`${API_ENDPOINTS.REPORTES.ADHERENCIA}?${params.toString()}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al generar el reporte de adherencia");
            }

            const data: AdherenceData = await response.json();
            setAdherenceData(data);

            if (data.totalEntrenamientos === 0) {
                toast.info("No se encontraron entrenamientos programados para este atleta en el rango de fechas seleccionado.");
            }

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoadingReporte(false);
        }
    };

    const selectedAtletaNombre = useMemo(() => {
        return atletas.find(a => a.id === selectedAtletaId)?.nombre_completo || '';
    }, [selectedAtletaId, atletas]);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Reporte de Adherencia al Entrenamiento</h2>
                <p className="text-muted-foreground">Analiza el cumplimiento de los planes de entrenamiento de un atleta en un período específico.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="select-atleta">Seleccionar Atleta *</Label>
                        <Select
                            value={selectedAtletaId}
                            onValueChange={setSelectedAtletaId}
                            disabled={isLoadingAtletas}
                        >
                            <SelectTrigger id="select-atleta">
                                <SelectValue placeholder={isLoadingAtletas ? "Cargando..." : "Seleccione un atleta"} />
                            </SelectTrigger>
                            <SelectContent>
                                {atletas.map(atleta => (
                                    <SelectItem key={atleta.id} value={atleta.id}>{atleta.nombre_completo}</SelectItem>
                                ))}
                                {atletas.length === 0 && !isLoadingAtletas && (
                                    <SelectItem value="" disabled>No hay atletas activos</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date-range">Rango de Fechas *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date-range"
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            `${format(dateRange.from, "dd LLL, y", { locale: es })} - ${format(dateRange.to, "dd LLL, y", { locale: es })}`
                                        ) : (
                                            format(dateRange.from, "dd LLL, y", { locale: es })
                                        )
                                    ) : (<span>Selecciona un rango</span>)}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} /></PopoverContent>
                        </Popover>
                    </div>
                    <Button onClick={handleGenerateReport} disabled={isLoadingReporte}>
                        {isLoadingReporte ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart className="mr-2 h-4 w-4" />}
                        Generar Reporte
                    </Button>
                </CardContent>
            </Card>

            {isLoadingReporte && (
                <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            )}

            {adherenceData && !isLoadingReporte && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultados de Adherencia para {selectedAtletaNombre}</CardTitle>
                        <CardDescription>
                            Período del {dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : ''} al {dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {adherenceData.totalEntrenamientos > 0 ? (
                            <>
                                <div className="text-center">
                                    <p className="text-6xl font-bold text-primary">{adherenceData.adherencia.toFixed(1)}%</p>
                                    <p className="text-muted-foreground">Tasa de Adherencia</p>
                                </div>
                                <Progress value={adherenceData.adherencia} className="w-full" />
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-semibold">{adherenceData.entrenamientosCompletados}</p>
                                        <p className="text-sm text-muted-foreground">Entrenamientos Completados</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-semibold">{adherenceData.totalEntrenamientos}</p>
                                        <p className="text-sm text-muted-foreground">Entrenamientos Programados</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-8">
                                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold">Sin Datos para Mostrar</h3>
                                <p className="text-muted-foreground mt-2">No se encontraron entrenamientos programados en el rango de fechas seleccionado.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {!adherenceData && !isLoadingReporte && (
                <Card className="flex items-center justify-center py-20">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">Selecciona los filtros y genera un reporte para ver los resultados.</p>
                        </div>
                    </CardContent>
            </Card>
            )}
        </div>
    );
}