'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  VisibilityState,
  SortingState,
  ColumnFiltersState,
  useReactTable,
  Row,
  Table as TanstackTable,
  Header,
  Cell,
  Column,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Atleta, Entrenador } from '@/lib/definitions';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import * as XLSX from 'xlsx'; // Importación principal
import { Loader2, PlusCircle, FileDown, MoreHorizontal, UserX, UserCheck, ChevronDown, Trash2, Edit, FileText, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react'; // Importar useSession

// Esquema de validación para el formulario
// --- CORRECCIÓN: Añadir 'es_menor' y validación condicional para CUI ---
const atletaSchema = z.object({
    id: z.string().optional(),
    id_usuario: z.string().optional(),
    nombre_completo: z.string().min(3, 'El nombre es requerido'),
    email: z.string().email('Email inválido'),
    fecha_nacimiento: z.string({ required_error: 'La fecha es requerida.' }).refine(val => !!val, 'La fecha es requerida'),
    sexo: z.enum(['Masculino', 'Femenino']),
    telefono: z.string().optional().nullable(),
    es_menor: z.boolean().default(false),
    codigo_identificacion: z.string().optional().nullable(),
    etnia: z.string().optional().nullable(),
    nacionalidad: z.string().optional().nullable(),
    direccion_residencia: z.string().optional().nullable(),
    comunidad_linguistica: z.string().optional().nullable(),
    departamento: z.string().optional().nullable(),
    municipio: z.string().optional().nullable(),
    asociacion_departamental: z.string().optional().nullable(),
    peso_corporal: z.preprocess((a) => a ? parseFloat(String(a)) : null, z.number().nullable().optional()),
    altura_cm: z.preprocess((a) => a ? parseInt(String(a), 10) : null, z.number().nullable().optional()),
    id_entrenador: z.string().optional().nullable(),
    foto_perfil: z.any().optional(),
    documento_dpi_frente: z.any().optional(),
    documento_dpi_reverso: z.any().optional(),
    activo: z.boolean().default(true),
}).refine(data => {
    if (!data.es_menor) {
        return !!data.codigo_identificacion && data.codigo_identificacion.length > 0;
    }
    return true;
}, {
    message: 'El CUI es requerido para mayores de edad.',
    path: ['codigo_identificacion'],
});
// --- FIN CORRECCIÓN ---

type FormData = z.infer<typeof atletaSchema>;

// --- Función auxiliar para limpiar URLs de imágenes ---
const getImageUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanedPath = path.replace(/^\/?uploads\//, '');
  return `/api/admin/documentos/${cleanedPath}`;
}

export default function AtletasPage() {
  const [data, setData] = useState<Atleta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedAtleta, setSelectedAtleta] = useState<Atleta | null>(null);
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
  const router = useRouter();
  const { data: session, status } = useSession(); // Obtener la sesión y el estado
  const [formOptions, setFormOptions] = useState<{
    departamentos: any[];
    municipios: any[];
    etnias: any[];
    comunidadesLinguisticas: any[];
    asociaciones: any[];
  } | null>(null);
  const [filteredMunicipios, setFilteredMunicipios] = useState<any[]>([]);

  const fetchData = async () => {
    // --- INICIO CORRECCIÓN: Usar el endpoint correcto según el rol ---
    // Si el usuario es un Entrenador, solo obtiene sus atletas.
    // Si es Administrador (o cualquier otro rol con permiso), obtiene todos.
    const isEntrenador = session?.user?.role === 'Entrenador';
    const endpoint = isEntrenador 
      ? '/api/entrenadores/me/atletas' 
      : '/api/atletas';

    try {
      setIsLoading(true);
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Error al cargar atletas desde ${endpoint}`);
      
      // Validación: Asegurar que la respuesta es JSON antes de parsear
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("La sesión ha expirado o el servidor no devolvió datos válidos.");
      }

      const atletas: Atleta[] = await res.json();
      setData(atletas);
    } catch (error: any) {
      toast.error('Error al cargar datos', { description: error.message });
    } finally {
      setIsLoading(false);
    }
    // --- FIN CORRECCIÓN ---
  };

  const fetchEntrenadores = async () => {
    try {
      const res = await fetch('/api/entrenadores');
      if (!res.ok) throw new Error('Error al cargar entrenadores');
      const entrenadoresData: Entrenador[] = await res.json();
      setEntrenadores(entrenadoresData);
    } catch (error: any) {
      toast.error('Error al cargar entrenadores', { description: error.message });
    }
  };

  useEffect(() => {
    // Evitar peticiones si la sesión aún está cargando
    if (status === "loading") return;

    const fetchOptions = async () => {
      try {
        const res = await fetch('/api/utils/form-options');
        if (!res.ok) throw new Error('No se pudieron cargar las opciones del formulario');
        const data = await res.json();
        setFormOptions(data);
      } catch (error: any) {
        toast.error('Error al cargar opciones del formulario', { description: error.message });
      }
    };

    fetchData();
    fetchEntrenadores();
    fetchOptions();
  }, [session, status]); // Añadir status como dependencia

  const form = useForm<FormData>({
    resolver: zodResolver(atletaSchema),
    defaultValues: {
      nombre_completo: '',
      email: '',
      fecha_nacimiento: '',
      sexo: undefined,
      es_menor: false,
      telefono: '',
      codigo_identificacion: '',
      etnia: undefined,
      comunidad_linguistica: undefined,
      nacionalidad: 'Guatemalteco(a)',
      direccion_residencia: '',
      departamento: undefined,
      municipio: undefined,
      asociacion_departamental: undefined,
      peso_corporal: null,
      altura_cm: null,
      id_entrenador: undefined,
    }
  });

  const departamentoValue = form.watch("departamento");
  const esMenorValue = form.watch("es_menor");

  useEffect(() => {
    if (departamentoValue && formOptions) {
      const selectedDept = formOptions.departamentos.find((d: any) => d.nombre === departamentoValue);
      if (selectedDept) {
        const filtered = formOptions.municipios.filter((m: any) => m.id_departamento === selectedDept.id);
        setFilteredMunicipios(filtered);
        // Si el municipio actual no pertenece al nuevo departamento, reinícialo
        const currentMunicipio = form.getValues('municipio');
        if (currentMunicipio && !filtered.some(m => m.nombre === currentMunicipio)) {
          form.setValue('municipio', undefined);
        }
      }
    } else {
      setFilteredMunicipios([]);
      form.setValue('municipio', undefined);
    }
  }, [departamentoValue, formOptions, form.getValues, form.setValue]);

  const handleOpenModal = (atleta: Atleta | null = null) => {
    if (atleta) {
      setSelectedAtleta(atleta);
      form.reset({
        id: atleta.id,
        id_usuario: (atleta as any).id_usuario,
        nombre_completo: atleta.nombre_completo,
        email: atleta.email || '',
        // --- CORRECCIÓN: Asegurar que la fecha esté en formato YYYY-MM-DD ---
        // Esto previene errores de 'Invalid time value' al parsear fechas con zona horaria.
        fecha_nacimiento: atleta.fecha_nacimiento ? atleta.fecha_nacimiento.split('T')[0] : '',
        sexo: atleta.sexo,
        telefono: atleta.telefono || '',
        es_menor: (atleta as any).es_menor != null 
          ? !!(atleta as any).es_menor 
          : (() => {
              if (!atleta.fecha_nacimiento) return false;
              try {
                const hoy = new Date();
                const fechaNac = new Date(atleta.fecha_nacimiento);
                let edad = hoy.getFullYear() - fechaNac.getFullYear();
                if (hoy.getMonth() < fechaNac.getMonth() || (hoy.getMonth() === fechaNac.getMonth() && hoy.getDate() < fechaNac.getDate())) {
                  edad--;
                }
                return edad < 18;
              } catch { return false; }
            })(),
        codigo_identificacion: atleta.codigo_identificacion ?? '',
        etnia: atleta.etnia || undefined,
        comunidad_linguistica: atleta.comunidad_linguistica || undefined,
        nacionalidad: atleta.nacionalidad || 'Guatemalteco(a)',
        direccion_residencia: atleta.direccion_residencia || '',
        departamento: atleta.departamento || undefined,
        municipio: atleta.municipio || undefined,
        asociacion_departamental: atleta.asociacion_departamental || undefined,
        peso_corporal: atleta.peso_corporal,
        altura_cm: atleta.altura_cm,
        activo: atleta.activo,
        foto_perfil: undefined,
        documento_dpi_frente: undefined,
        documento_dpi_reverso: undefined,
        id_entrenador: (atleta as any).id_entrenador || undefined,
      });
    } else {
      setSelectedAtleta(null);
      form.reset({
        id: undefined,
        id_usuario: undefined,
        nombre_completo: '',
        email: '',
        fecha_nacimiento: '',
        sexo: undefined,
        es_menor: false,
        telefono: '',
        codigo_identificacion: '',
        etnia: undefined,
        comunidad_linguistica: undefined,
        nacionalidad: 'Guatemalteco(a)',
        direccion_residencia: '',
        departamento: undefined,
        municipio: undefined,
        asociacion_departamental: undefined,
        peso_corporal: null,
        altura_cm: null,
        id_entrenador: undefined,
        foto_perfil: undefined,
        documento_dpi_frente: undefined,
        documento_dpi_reverso: undefined,
        activo: true,
        // Los demás valores se tomarán de `defaultValues`
      });
    }
    setIsModalOpen(true);
  };

  const handleToggleAtleta = async (atletaId: string, activo: boolean) => {
    try {
      const res = await fetch(`/api/atletas/${atletaId}/toggle-activation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: activo }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || (activo ? 'Error al activar' : 'Error al desactivar'));
      }
      toast.success(`Atleta ${activo ? 'activado' : 'desactivado'}`);
      fetchData(); 
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteAtleta = (atleta: Atleta) => {
    setSelectedAtleta(atleta);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAtleta) return;
    try {
      const res = await fetch(`/api/atletas/${selectedAtleta.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar atleta');
      toast.success('Atleta eliminado exitosamente');
      fetchData(); 
      setIsDeleteAlertOpen(false);
      setSelectedAtleta(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const columns: ColumnDef<Atleta>[] = [
    {
      id: 'select',
      header: ({ table }: { table: TanstackTable<Atleta> }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todo"
        />
      ),
      cell: ({ row }: { row: Row<Atleta> }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'nombre_completo',
      header: 'Nombre',
      cell: ({ row }: { row: Row<Atleta> }) => <div className="font-medium">{row.getValue('nombre_completo')}</div>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'asociacion_departamental',
      header: 'Asociación',
    },
    {
      accessorKey: 'entrenador_nombre_completo',
      header: 'Entrenador',
      cell: ({ row }: { row: Row<Atleta> }) => <div>{row.getValue('entrenador_nombre_completo') || 'No asignado'}</div>,
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: ({ row }: { row: Row<Atleta> }) => (
        // --- CORRECCIÓN: Usar 'outline' para inactivos para mejor contraste ---
        <Badge variant={row.getValue('activo') ? 'default' : 'outline'}>
          {row.getValue('activo') ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: Row<Atleta> }) => {
        const atleta = row.original;
        // --- INICIO CORRECCIÓN: Ocultar acciones para Entrenadores ---
        const isEntrenador = session?.user?.role === 'Entrenador';

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" /> 
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/atletas/${atleta.id}`)}>
                Ver Detalles
              </DropdownMenuItem>
              {!isEntrenador && (
                <>
                  <DropdownMenuItem onClick={() => handleOpenModal(atleta)}>
                    <Edit className="h-4 w-4 mr-2 inline-block" />Editar
                  </DropdownMenuItem>
                  {atleta.activo ? (
                    <DropdownMenuItem className="text-yellow-600 focus:text-yellow-700" onClick={() => handleToggleAtleta(atleta.id, false)}>
                      <UserX className="h-4 w-4 mr-2 inline-block" />Desactivar
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem className="text-green-600 focus:text-green-700" onClick={() => handleToggleAtleta(atleta.id, true)}>
                      <UserCheck className="h-4 w-4 mr-2 inline-block" />Activar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={() => handleDeleteAtleta(atleta)}>
                    <Trash2 className="h-4 w-4 mr-2 inline-block" />Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      columnVisibility,
    },
  });

  const onSubmit: (data: FormData) => void = async (formData) => {
    const submissionData = new FormData();

    // Append all form data fields. FormData converts values to strings automatically.
    Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            if (key === 'id_entrenador' && value === 'NONE') {
                submissionData.append(key, ''); // Enviar vacío para desasignar
            } else if (value instanceof File) {
                submissionData.append(key, value); // Enviar el archivo real, no texto
            } else {
                submissionData.append(key, String(value));
            }
        }
    });

    const url = selectedAtleta ? `/api/atletas/${selectedAtleta.id}` : '/api/atletas';
    const method = selectedAtleta ? 'PUT' : 'POST';

    try {
      // Al enviar FormData, no se debe establecer el header 'Content-Type'.
      // El navegador lo hará automáticamente con el 'boundary' correcto.
      const res = await fetch(url, {
        method: method,
        body: submissionData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error al ${selectedAtleta ? 'actualizar' : 'crear'} atleta`);
      }

      toast.success(`Atleta ${selectedAtleta ? 'actualizado' : 'creado'} exitosamente`);
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Hubo un problema al guardar los datos', {
        description: error.message
      });
    }
  };

  // --- INICIO CORRECCIÓN: Exportación a Excel completa ---
  const exportToExcel = () => {
    const atletasToExport = table.getFilteredRowModel().rows.map(row => row.original);
    if (atletasToExport.length === 0) {
      toast.warning("No hay atletas para exportar.");
      return;
    }

    toast.info("Generando reporte en Excel...");

    const tableData = atletasToExport.map((atleta) => ({
      'Nombre Completo': atleta.nombre_completo,
      'Email': atleta.email,
      'Teléfono': atleta.telefono || 'N/A',
      'Fecha de Nacimiento': atleta.fecha_nacimiento ? format(new Date(atleta.fecha_nacimiento), 'dd/MM/yyyy', { locale: es }) : 'N/A',
      'Sexo': atleta.sexo,
      'Menor de Edad': atleta.es_menor ? 'Sí' : 'No', // Corregido con la actualización de la interfaz Atleta
      'CUI/Identificación': atleta.codigo_identificacion || 'N/A',
      'Etnia': atleta.etnia || 'N/A',
      'Comunidad Lingüística': atleta.comunidad_linguistica || 'N/A',
      'Nacionalidad': atleta.nacionalidad || 'N/A',
      'Dirección': atleta.direccion_residencia || 'N/A',
      'Departamento': atleta.departamento || 'N/A',
      'Municipio': atleta.municipio || 'N/A',
      'Asociación': atleta.asociacion_departamental || 'N/A',
      'Peso Corporal (kg)': atleta.peso_corporal ?? 'N/A',
      'Altura (cm)': atleta.altura_cm ?? 'N/A',
      'Entrenador': atleta.entrenador_nombre_completo || 'No asignado',
      'Estado': atleta.activo ? 'Activo' : 'Inactivo',
    }));

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Atletas");
    XLSX.writeFile(wb, "Reporte_General_Atletas.xlsx");
  };
  // --- FIN CORRECCIÓN ---

  // --- INICIO CORRECCIÓN: Exportación a PDF profesional ---
  const exportToPDF = async () => {
    const atletasToExport = table.getFilteredRowModel().rows.map(row => row.original);
    if (atletasToExport.length === 0) {
      toast.warning("No hay atletas para exportar.");
      return;
    }

    toast.info("Generando reporte en PDF...");

    try {
      // Usamos la función de `report-generator` para consistencia
      const { generatePdfReport } = await import('@/lib/report-generator'); // Importación dinámica
      const dataForReport = atletasToExport.map(atleta => ({
        ...atleta,
        id: atleta.id,
        codigo_identificacion: atleta.codigo_identificacion || 'N/A',
        entrenador_nombre_completo: atleta.entrenador_nombre_completo || 'No asignado',
      }));
      await generatePdfReport(dataForReport, "Reporte General de Atletas");
    } catch (error: any) {
      toast.error("Error al generar el PDF", {
        description: error.message,
      });
    }
  };
  // --- FIN CORRECCIÓN ---

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Atletas</h2>
          <p className="text-muted-foreground">Crea, edita y administra a los atletas del sistema.</p>
        </div>
        {/* --- INICIO CORRECCIÓN: Ocultar botón de crear para Entrenadores --- */}
        {session?.user?.role !== 'Entrenador' && (
          <Button onClick={() => handleOpenModal()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Atleta
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filtrar por nombre..."
          value={(table.getColumn('nombre_completo')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('nombre_completo')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex space-x-2">
          <Button onClick={exportToExcel} variant="outline" size="sm" className="ml-4">
            <FileDown className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columnas <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column: Column<Atleta>) => column.getCanHide()) 
                .map((column: Column<Atleta>) => { 
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header: Header<Atleta, unknown>) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row: Row<Atleta>) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell: Cell<Atleta, unknown>) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No se encontraron resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedAtleta ? 'Editar Atleta' : 'Crear Nuevo Atleta'}</DialogTitle>
            <DialogDescription>
              {selectedAtleta ? 'Actualiza los datos del atleta.' : 'Completa el formulario para crear un nuevo atleta.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4 max-h-[60vh] overflow-y-auto pr-3">
                <FormField control={form.control} name="nombre_completo" render={({ field }) => (<FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input autoComplete="name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" autoComplete="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="space-y-2 pt-2">
                  <Label htmlFor="fecha_nacimiento_button" className={cn(form.formState.errors.fecha_nacimiento && "text-destructive")}>Fecha de Nacimiento</Label>
                  <Controller
                    name="fecha_nacimiento"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <>
                        <Popover>
                          <PopoverTrigger asChild id="fecha_nacimiento_button">
                            <Button 
                              id="fecha_nacimiento_button" 
                              variant={"outline"} 
                              className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground", fieldState.error && "border-destructive")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value && field.value.trim() && !isNaN(new Date(field.value).getTime()) ? format(new Date(`${field.value}T00:00:00`), "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              value={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                              onChange={(date: any) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')} />
                          </PopoverContent>
                        </Popover>
                        {fieldState.error && <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p>}
                      </>
                    )}
                  />
                </div>
                <FormField control={form.control} name="sexo" render={({ field }) => (<FormItem><FormLabel>Sexo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione sexo..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Femenino">Femenino</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="telefono" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input autoComplete="tel" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                {/* --- INICIO CORRECCIÓN: Lógica condicional para CUI y Menor de Edad --- */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-center">
                    <FormField control={form.control} name="es_menor" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-4 h-full">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">¿Es menor de edad?</FormLabel>
                                <FormMessage />
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!!selectedAtleta} />
                            </FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="codigo_identificacion" render={({ field }) => (
                        <FormItem>
                            <FormLabel>{esMenorValue ? 'CUI / Código de Nacimiento' : 'CUI / DPI'}</FormLabel>
                            <FormControl><Input autoComplete="off" {...field} value={field.value ?? ''} /></FormControl><FormMessage />
                        </FormItem>
                    )} />
                </div>
                {/* --- FIN CORRECCIÓN --- */}
                <FormField control={form.control} name="nacionalidad" render={({ field }) => (<FormItem><FormLabel>Nacionalidad</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Guatemalteco(a)">Guatemalteco(a)</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="direccion_residencia" render={({ field }) => (<FormItem><FormLabel>Dirección</FormLabel><FormControl><Input autoComplete="street-address" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="departamento" render={({ field }) => (
                  <FormItem><FormLabel>Departamento</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder={formOptions ? "Selecciona..." : "Cargando..."} /></SelectTrigger></FormControl><SelectContent>{formOptions?.departamentos.map((d: any) => <SelectItem key={d.id} value={d.nombre}>{d.nombre}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="municipio" render={({ field }) => (
                  <FormItem><FormLabel>Municipio</FormLabel><Select onValueChange={field.onChange} value={field.value || ''} disabled={!departamentoValue}><FormControl><SelectTrigger><SelectValue placeholder={departamentoValue ? "Selecciona..." : "Elige un depto."} /></SelectTrigger></FormControl><SelectContent>{filteredMunicipios.map((m: any) => <SelectItem key={m.id} value={m.nombre}>{m.nombre}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="etnia" render={({ field }) => (
                  <FormItem><FormLabel>Etnia</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder={formOptions ? "Selecciona..." : "Cargando..."} /></SelectTrigger></FormControl><SelectContent>{formOptions?.etnias.map((e: any) => <SelectItem key={e.id} value={e.nombre}>{e.nombre}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="comunidad_linguistica" render={({ field }) => (
                  <FormItem><FormLabel>Comunidad Lingüística</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder={formOptions ? "Selecciona..." : "Cargando..."} /></SelectTrigger></FormControl><SelectContent>{formOptions?.comunidadesLinguisticas.map((c: any) => <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="asociacion_departamental" render={({ field }) => (
                  <FormItem><FormLabel>Asociación</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder={formOptions ? "Selecciona..." : "Cargando..."} /></SelectTrigger></FormControl><SelectContent>{formOptions?.asociaciones.map((a: any) => <SelectItem key={a.id} value={a.nombre}>{a.nombre}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="peso_corporal" render={({ field }) => (<FormItem><FormLabel>Peso Corporal (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="altura_cm" render={({ field }) => (<FormItem><FormLabel>Altura (cm)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="id_entrenador" render={({ field }) => (<FormItem><FormLabel>Entrenador</FormLabel><Select onValueChange={(value) => field.onChange(value === "NONE" ? undefined : value)} value={field.value || "NONE"}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione entrenador..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="NONE">Sin Asignar</SelectItem>{entrenadores.map(e => (<SelectItem key={e.id} value={e.id}>{e.nombre_completo}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                
                {/* --- Campos de Archivos --- */}
                <FormField control={form.control} name="foto_perfil" render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>{selectedAtleta ? 'Cambiar Foto de Perfil' : 'Foto de Perfil'}</FormLabel>
                    <FormControl>
                      <Input {...fieldProps} type="file" accept="image/*" onChange={(event) => { onChange(event.target.files && event.target.files[0]); }} />
                    </FormControl>
                    {selectedAtleta?.foto_url && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Actual: <a href={getImageUrl(selectedAtleta.foto_url)} target="_blank" rel="noreferrer" className="underline text-primary">Ver imagen</a>
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="documento_dpi_frente" render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>{selectedAtleta ? 'Cambiar Documento (Frente)' : 'Documento (Frente)'}</FormLabel>
                    <FormControl>
                      <Input {...fieldProps} type="file" accept="image/*" onChange={(event) => { onChange(event.target.files && event.target.files[0]); }} />
                    </FormControl>
                    {selectedAtleta?.documento_dpi_frente && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Actual: <a href={getImageUrl(selectedAtleta.documento_dpi_frente)} target="_blank" rel="noreferrer" className="underline text-primary">Ver documento</a>
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="documento_dpi_reverso" render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>{selectedAtleta ? 'Cambiar Documento (Reverso)' : 'Documento (Reverso)'}</FormLabel>
                    <FormControl>
                      <Input {...fieldProps} type="file" accept="image/*" onChange={(event) => { onChange(event.target.files && event.target.files[0]); }} />
                    </FormControl>
                    {selectedAtleta?.documento_dpi_reverso && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Actual: <a href={getImageUrl(selectedAtleta.documento_dpi_reverso)} target="_blank" rel="noreferrer" className="underline text-primary">Ver documento</a>
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )} />

                {selectedAtleta && (
                  <div className="flex items-center space-x-2 md:col-span-2">
                      <FormField control={form.control} name="activo" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Switch id="activo" checked={field.value} onCheckedChange={field.onChange} /></FormControl><Label htmlFor="activo">{field.value ? "Atleta Activo" : "Atleta Inactivo"}</Label></FormItem>)} />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">
                  {selectedAtleta ? 'Actualizar Atleta' : 'Crear Atleta'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al atleta <span className="font-bold">{selectedAtleta?.nombre_completo}</span>. 
              Esto también eliminará al usuario asociado. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
