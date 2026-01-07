"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlanNutricional } from "@/lib/definitions";
import jsPDF from "jspdf";
import autoTable, { RowInput } from 'jspdf-autotable';
import { Download } from "lucide-react";

interface DietPlanDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanNutricional | null;
}

export function DietPlanDetailDialog({ isOpen, onClose, plan }: DietPlanDetailDialogProps) {
  if (!plan || !plan.plan_detallado) return null;

  const generatePDF = () => {
    if (!plan) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(plan.nombre || 'Plan de Alimentación', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Objetivo: ${plan.objetivo}`, 105, 28, { align: 'center' });

    const bodyData: RowInput[] = Object.entries(planDetallado).flatMap(([dia, comidas]: [string, any]) => {
        const diaHeader: RowInput = [{ content: dia.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), colSpan: 3, styles: { fontStyle: 'bold', fillColor: '#d3d3d3', textColor: 20 } }];
        const comidasData = Object.entries(comidas).map(([nombreComida, detalles]: [string, any]) => [
            nombreComida.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            detalles.hora,
            detalles.descripcion
        ]);
        return [diaHeader, ...comidasData];
    });

    autoTable(doc, {
        startY: 45,
        head: [['Comida', 'Hora', 'Descripción']],
        body: bodyData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Plan_Alimentacion_${plan.nombre.replace(/ /g, '_')}.pdf`);
  };

  // Asegurarse de que plan_detallado es un objeto
  const planDetallado = typeof plan.plan_detallado === 'string' 
    ? JSON.parse(plan.plan_detallado) 
    : plan.plan_detallado;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{plan.nombre || 'Plan de Alimentación'}</DialogTitle>
          <DialogDescription>Detalles del plan nutricional para {plan.objetivo}.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {Object.entries(planDetallado).map(([dia, comidas]: [string, any]) => (
              <div key={dia}>
                <h3 className="font-bold text-xl capitalize border-b pb-2 mb-2">{dia.replace('_', ' ')}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Comida</TableHead>
                      <TableHead className="w-[100px]">Hora</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(comidas).map(([nombreComida, detalles]: [string, any]) => (
                      <TableRow key={nombreComida}>
                        <TableCell className="font-medium capitalize">{nombreComida}</TableCell>
                        <TableCell>{detalles.hora}</TableCell>
                        <TableCell>{detalles.descripcion}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
