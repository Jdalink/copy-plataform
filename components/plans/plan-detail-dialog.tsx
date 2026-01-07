"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlanEntrenamiento } from "@/lib/definitions";
import jsPDF from "jspdf";
import autoTable, { RowInput } from 'jspdf-autotable';
import { Download } from "lucide-react";

interface PlanDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanEntrenamiento | null;
}

export function PlanDetailDialog({ isOpen, onClose, plan }: PlanDetailDialogProps) {
    if (!plan || !plan.plan_detallado) return null;

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(plan.nombre, 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Plan para: ${plan.atleta_nombre} ${plan.atleta_apellido}`, 105, 28, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Objetivo: ${plan.objetivo} | Nivel: ${plan.nivel} | ${plan.frecuencia} días/semana`, 105, 35, { align: 'center' });

        const bodyData: RowInput[] = Object.entries(plan.plan_detallado).flatMap(([semanaKey, semanaVal]: [string, any]) => {
            const semanaHeader: RowInput = [{ content: semanaKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), colSpan: 5, styles: { fontStyle: 'bold', fillColor: '#d3d3d3', textColor: 20 } }];

            const diasData = Object.entries(semanaVal).flatMap(([dia, detalles]: [string, any]) => {
                if (!Array.isArray(detalles.ejercicios)) return [];
                return detalles.ejercicios.map((ej: any, index: number) => {
                    const diaCell = index === 0 ? dia.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
                    const enfoqueCell = index === 0 ? detalles.enfoque : '';
                    const seriesReps = ej.series_reps || `${ej.series}x${ej.reps}`;
                    const peso = `${ej.peso} ${ej.unidades_peso || 'kg'}`;
                    return [diaCell, enfoqueCell, ej.nombre, seriesReps, peso];
                });
            });
            return [semanaHeader, ...diasData];
        });

        autoTable(doc, {
            startY: 45,
            head: [['Día', 'Enfoque', 'Ejercicio', 'Series y Reps', 'Peso/Intensidad']],
            body: bodyData,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
        });

        doc.save(`Plan_${plan.atleta_nombre}_${plan.atleta_apellido}.pdf`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{plan.nombre}</DialogTitle>
                    <DialogDescription>Plan de entrenamiento detallado.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-6">
                        {Object.entries(plan.plan_detallado).map(([semanaKey, semanaVal]: [string, any]) => (
                            <div key={semanaKey}>
                                <h3 className="font-bold text-xl capitalize border-b pb-2 mb-2">{semanaKey.replace('_', ' ')}</h3>
                                {Object.entries(semanaVal).map(([dia, detalles]: [string, any]) => (
                                    <div key={dia} className="mb-4">
                                        <h4 className="font-semibold text-lg capitalize">{dia.replace('_', ' ')}: <span className="text-base font-normal text-muted-foreground">{detalles.enfoque}</span></h4>
                                        <Table><TableHeader><TableRow><TableHead>Ejercicio</TableHead><TableHead>Series y Reps</TableHead><TableHead>Peso/Intensidad</TableHead></TableRow></TableHeader><TableBody>{Array.isArray(detalles.ejercicios) && detalles.ejercicios.map((ej: any, index: number) => (<TableRow key={index}><TableCell>{ej.nombre}</TableCell><TableCell>{ej.series_reps || `${ej.series}x${ej.reps}`}</TableCell><TableCell>{ej.peso} {ej.unidades_peso || 'kg'}</TableCell></TableRow>))}</TableBody></Table>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <DialogFooter className="justify-between">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    <Button onClick={generatePDF}><Download className="mr-2 h-4 w-4"/>Descargar PDF</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
