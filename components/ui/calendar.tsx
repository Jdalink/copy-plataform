"use client"

import OriginalCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
/* Importamos los estilos personalizados que coinciden con el tema */
import './custom-calendar.css'; 
import { cn } from '@/lib/utils';

// Definimos los tipos para el valor que puede ser una fecha, un rango o nulo.
type ValuePiece = Date | null;
export type CalendarValue = ValuePiece | [ValuePiece, ValuePiece] | undefined;

export interface CalendarProps {
  onChange: (value: CalendarValue) => void;
  value: CalendarValue;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  selectRange?: boolean;
  locale?: string;
}

function Calendar({
  className,
  value,
  onChange,
  minDate,
  maxDate,
  selectRange = false,
  locale = "es-GT",
  ...props
}: CalendarProps) {
  return (
    <OriginalCalendar
      onChange={onChange}
      value={value}
      className={cn("react-calendar-custom", className)} // Clase para estilos personalizados
      minDate={minDate}
      maxDate={maxDate}
      selectRange={selectRange}
      locale={locale}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
