// lib/excel-exporter.ts
import * as XLSX from 'xlsx';
import { Atleta } from './definitions';

type AtletaExportData = Omit<Atleta, 'documento_dpi_frente' | 'documento_dpi_reverso' | 'foto_url'>;

/**
 * Exporta un array de datos de atletas a un archivo Excel.
 * @param atletas - El array de objetos de atletas a exportar.
 * @param fileName - El nombre del archivo a generar (sin extensión).
 */
export function exportAtletasToExcel(atletas: AtletaExportData[], fileName: string): void {
  // Mapear los datos para que las cabeceras sean más legibles
  const dataToExport = atletas.map(atleta => ({
    'ID': atleta.id,
    'Código Identificación': atleta.codigo_identificacion,
    'Nombre Completo': atleta.nombre_completo,
    'Fecha Nacimiento': atleta.fecha_nacimiento ? new Date(atleta.fecha_nacimiento).toLocaleDateString('es-GT') : '',
    'Sexo': atleta.sexo,
    'Etnia': atleta.etnia,
    'Comunidad Lingüística': atleta.comunidad_linguistica,
    'Nacionalidad': atleta.nacionalidad,
    'Teléfono': atleta.telefono,
    'Email': atleta.email,
    'Dirección': atleta.direccion_residencia,
    'Departamento': atleta.departamento,
    'Municipio': atleta.municipio,
    'Asociación Departamental': atleta.asociacion_departamental,
    'Categoría Peso': atleta.categoria_peso,
    'Peso Corporal (kg)': atleta.peso_corporal,
    'Altura (cm)': atleta.altura_cm,
    'Entrenador Asignado': atleta.entrenador_nombre_completo,
    'Estado': atleta.activo ? 'Activo' : 'Inactivo',
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Atletas');

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}