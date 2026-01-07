// lib/report-generator.ts
import jsPDF from 'jspdf';
import { toast } from 'sonner';
// --- INICIO DE LA CORRECCIÓN: Importar ambos logos ---
import logoFedepotencia from '@/public/icons/android-chrome-192x192.png'; // Logo de la derecha (Federación)
import logoInstitucional from '@/public/icons/logo_cdag.png';   // Logo de la izquierda (CDAG)
// --- FIN DE LA CORRECCIÓN ---
// --- INICIO CORRECCIÓN: Importar interfaces desde definitions ---
import { EntrenadorDetails, Atleta, Entrenador } from './definitions'; 
// --- FIN CORRECCIÓN ---

// --- INICIO CORRECCIÓN: Definir tipo para generatePdfReport ---
// Este tipo debe coincidir con los datos que le pasas
type ReportAtletaData = Pick<Atleta, 
    'id' | 'nombre_completo' | 'codigo_identificacion' | 'email' | 'telefono' | 'fecha_nacimiento' | 'sexo' |
    'asociacion_departamental' | 'departamento' | 'municipio' | 'categoria_peso' | 'peso_corporal' | 'activo'
> & {
    entrenador_nombre_completo?: string | null;
};
// --- FIN CORRECCIÓN ---

// --- INICIO CORRECCIÓN: Mapeo de comunidades lingüísticas a números ---
const comunidadLinguisticaMap: { [key: string]: string } = {
  'Achi´': '1',
  'Akateko': '2',
  'Awakateko': '3',
  'Chuj': '4',
  'Ixil': '7',
  'Kaqchikel': '8',
  'K´iche´': '9',
  'Mam': '10',
  'Mopán': '11',
  'Popti (Jakalteco)': '12',
  'Q´anjob´al': '15',
  'Q´eqchi´': '16',
  'Sakalputeko': '17',
  'Sikapapense': '18',
  'Tektiteko': '19',
  'Xinka': '22',
  'Garifuna': '23',
  'Castellano (español)': '24',
};
// --- FIN CORRECCIÓN ---

// Función para calcular el rango de edad (usada por Ficha)
const getRangoEdad = (fechaNacimiento: string): string => {
  // --- INICIO CORRECCIÓN: Cálculo de edad más preciso y manejo de menores de 14 ---
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  if (edad < 14) return 'Menor de 14';
  if (edad >= 14 && edad <= 23) return '14 a 23 años';
  if (edad >= 24) return '24 en adelante';
  return 'Otro';
  // --- FIN CORRECCIÓN ---
};

// --- INICIO CORRECCIÓN DEFINITIVA ---
// 2. La función ya no necesita recibir URLs de logos. Es autosuficiente.
export const generateFichaEntrenadorPdf = async (entrenador: EntrenadorDetails) => {
  // Carga dinámica de autoTable para compatibilidad con Next.js
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'landscape' });
  const today = new Date();
  const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  
  try {
    // --- CORRECCIÓN DEFINITIVA: Usar los datos de la imagen directamente ---
    // Al importar la imagen, Next.js nos da un objeto que incluye una URL de datos Base64 (`blurDataURL`).
    // Esto elimina la necesidad de `fetch` y funciona de forma fiable.
    doc.addImage(logoInstitucional.src, 'PNG', 15, 10, 25, 25);
    doc.addImage(logoFedepotencia.src, 'PNG', doc.internal.pageSize.getWidth() - 40, 10, 25, 25);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PERTENENCIA SOCIOLINGUISTICA', doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
    
    // --- Información del Entrenador y Mes ---
    doc.setFontSize(12);
    doc.text(`MES: ${monthNames[today.getMonth()]}`, 15, 45);
    doc.text(`ENTRENADOR: ${entrenador.nombre} ${entrenador.apellido}`, doc.internal.pageSize.getWidth() / 2, 45, { align: 'center' });
    doc.text(`DEPARTAMENTO: ${entrenador.asociacion_departamental || 'N/E'}`, doc.internal.pageSize.getWidth() - 15, 45, { align: 'right' });
    
    // --- Tabla de Atletas ---
    // CORRECCIÓN: Validar que existan atletas antes de intentar mapearlos.
    if (!entrenador.atletasAsignados || entrenador.atletasAsignados.length === 0) {
      toast.warning("No se puede generar la ficha.", { description: "El entrenador no tiene atletas asignados." });
      return;
    }

    const tableData = entrenador.atletasAsignados.map((atleta, index) => {
      const rangoEdad = getRangoEdad(atleta.fecha_nacimiento || '1900-01-01'); // Fallback por si fecha_nacimiento es opcional
      return [
        index + 1,
        atleta.nombre_completo,
        atleta.codigo_identificacion || 'N/A', // Usar N/A si es null/undefined
        // --- INICIO CORRECCIÓN: Lógica correcta para marcar sexo, edad y etnia ---
        atleta.sexo?.toLowerCase() === 'masculino' ? 'X' : '',
        atleta.sexo?.toLowerCase() === 'femenino' ? 'X' : '',
        rangoEdad === '14 a 23 años' ? 'X' : '',
        rangoEdad === '24 en adelante' ? 'X' : '',
        atleta.comunidad_linguistica ? comunidadLinguisticaMap[atleta.comunidad_linguistica] || 'N/A' : 'N/A',
        atleta.etnia?.toLowerCase() === 'maya' ? 'X' : '',
        atleta.etnia?.toLowerCase() === 'xinca' ? 'X' : '',
        atleta.etnia?.toLowerCase() === 'garifuna' ? 'X' : '',
        atleta.etnia?.toLowerCase() === 'ladino' || atleta.etnia?.toLowerCase() === 'mestizo' ? 'X' : '', // Acepta ambos términos
        atleta.etnia?.toLowerCase() === 'otro' ? 'X' : '',
        // --- FIN CORRECCIÓN ---
        ' ', // Columna "Total"
      ];
    });

    autoTable(doc, {
      startY: 55,
      head: [
        [
          { content: 'No.', rowSpan: 2 }, { content: 'INFORMACION DEL ATLETA', colSpan: 2 },
          { content: 'SEXO', colSpan: 2 }, { content: 'Rango de Edad', colSpan: 2 },
          { content: 'Comunidad Lingüística', rowSpan: 2 }, { content: 'Grupo Étnico', colSpan: 5 },
          { content: 'Total', rowSpan: 2 },
        ],
        [
          'NOMBRE DEL ATLETA', 'C.U.I.', 'M', 'F', '14 a 23 años', '24 en adelante',
          'Maya', 'Xinca', 'Garifuna', 'Ladino', 'Otro',
        ]
      ],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1, halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [200, 200, 200], textColor: 40, fontStyle: 'bold' },
    });
    
    doc.save(`Ficha_Entrenador_${entrenador.nombre}_${entrenador.apellido}.pdf`);

  } catch (error) {
    console.error("Error al generar el PDF de la ficha:", error);
    toast.error("No se pudo generar el PDF. Logos no cargados.");
  }
};

// --- INICIO CORRECCIÓN: Añadir la función 'generatePdfReport' que faltaba y corregir carga de logos ---
// 4. La función para reportes de atletas tampoco necesita recibir una URL.
export async function generatePdfReport(atletas: ReportAtletaData[], title: string = "Reporte de Atletas") {
  const doc = new jsPDF({ orientation: 'landscape' }); // Orientación horizontal para más espacio
  const today = new Date().toLocaleDateString('es-GT');

  const addHeaderFooter = () => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          // --- CORRECCIÓN: Logos más pequeños y mejor posicionados ---
          doc.addImage(logoInstitucional.src, 'PNG', 15, 8, 18, 18);
          doc.addImage(logoFedepotencia.src, 'PNG', doc.internal.pageSize.getWidth() - 33, 8, 18, 18);
          
          doc.setFontSize(16); doc.setTextColor(40);
          doc.setFont('helvetica', 'bold');
          doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
          
          doc.setFontSize(8); doc.setTextColor(150);
          doc.setFont('helvetica', 'normal');
          doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
          doc.text(`Generado el: ${today}`, 14, doc.internal.pageSize.getHeight() - 10);
      }
  };

  // --- CORRECCIÓN: Cabeceras ampliadas para incluir más datos ---
  const head = [['Nombre Completo', 'CUI/ID', 'Email', 'Teléfono', 'Nacimiento', 'Sexo', 'Asociación', 'Departamento', 'Municipio', 'Peso (kg)', 'Entrenador', 'Estado']];
  const body = atletas.map(atleta => [
      atleta.nombre_completo,
      atleta.codigo_identificacion || 'N/A',
      atleta.email || '-',
      atleta.telefono || '-',
      atleta.fecha_nacimiento ? new Date(atleta.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-GT') : '-',
      atleta.sexo || '-',
      atleta.asociacion_departamental || '-',
      atleta.departamento || '-',
      atleta.municipio || '-',
      atleta.peso_corporal?.toString() || '-',
      atleta.entrenador_nombre_completo || 'N/A',
      atleta.activo ? 'Activo' : 'Inactivo'
  ]);

  // Carga dinámica de autoTable para compatibilidad con Next.js
  const autoTable = (await import('jspdf-autotable')).default;

  autoTable(doc, {
      startY: 30, // Más espacio para el header
      head: head, 
      body: body, 
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] },
      styles: {
        fontSize: 8, // Letra más pequeña para que quepa todo
        cellPadding: 2,
      },
      didDrawPage: () => { addHeaderFooter(); },
      margin: { top: 28, bottom: 15 } // Ajustar márgenes
  });

  addHeaderFooter();

  doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}_${today.replace(/\//g, '-')}.pdf`);
}
// --- FIN DE LA CORRECCIÓN DEFINITIVA ---

// --- INICIO NUEVA FUNCIÓN: Ficha detallada de Atleta ---
export async function generateFichaAtletaPdf(atleta: Atleta) {
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF();
  const today = new Date().toLocaleDateString('es-GT');

  try {
    // Header
    doc.addImage(logoInstitucional.src, 'PNG', 15, 10, 25, 25);
    doc.addImage(logoFedepotencia.src, 'PNG', doc.internal.pageSize.getWidth() - 40, 10, 25, 25);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHA DETALLADA DEL ATLETA', doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });

    // Basic Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre Completo: ${atleta.nombre_completo}`, 15, 45);
    doc.text(`Email: ${atleta.email || 'N/A'}`, 15, 52);
    doc.text(`Teléfono: ${atleta.telefono || 'N/A'}`, 15, 59);
    doc.text(`CUI/Identificación: ${atleta.codigo_identificacion || 'N/A'}`, 15, 66);
    doc.text(`Fecha de Nacimiento: ${atleta.fecha_nacimiento ? new Date(atleta.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-GT') : 'N/A'}`, 15, 73);
    doc.text(`Sexo: ${atleta.sexo || 'N/A'}`, 15, 80);
    doc.text(`Menor de Edad: ${atleta.es_menor ? 'Sí' : 'No'}`, 15, 87);

    // Physical Info
    doc.text(`Peso Corporal: ${atleta.peso_corporal ? atleta.peso_corporal + ' kg' : 'N/A'}`, 100, 45);
    doc.text(`Altura: ${atleta.altura_cm ? atleta.altura_cm + ' cm' : 'N/A'}`, 100, 52);
    doc.text(`Categoría de Peso: ${atleta.categoria_peso || 'N/A'}`, 100, 59);
    doc.text(`Estado: ${atleta.activo ? 'Activo' : 'Inactivo'}`, 100, 66);
    doc.text(`Entrenador Asignado: ${atleta.entrenador_nombre_completo || 'No Asignado'}`, 100, 73);

    // Location & Cultural Info
    doc.text(`Nacionalidad: ${atleta.nacionalidad || 'N/A'}`, 15, 97);
    doc.text(`Dirección: ${atleta.direccion_residencia || 'N/A'}`, 15, 104);
    doc.text(`Departamento: ${atleta.departamento || 'N/A'}`, 15, 111);
    doc.text(`Municipio: ${atleta.municipio || 'N/A'}`, 15, 118);
    doc.text(`Asociación: ${atleta.asociacion_departamental || 'N/A'}`, 15, 125);
    doc.text(`Etnia: ${atleta.etnia || 'N/A'}`, 15, 132);
    doc.text(`Comunidad Lingüística: ${atleta.comunidad_linguistica || 'N/A'}`, 15, 139);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generado el: ${today}`, 14, doc.internal.pageSize.getHeight() - 10);

    doc.save(`Ficha_Atleta_${atleta.nombre_completo.replace(/\s/g, '_')}.pdf`);

  } catch (error) {
    console.error("Error al generar el PDF de la ficha del atleta:", error);
    toast.error("No se pudo generar el PDF de la ficha del atleta.");
  }
}
// --- FIN NUEVA FUNCIÓN ---

// --- INICIO NUEVA FUNCIÓN: Reporte para Entrenadores ---
export async function generateEntrenadoresPdfReport(entrenadores: Entrenador[], title: string = "Reporte de Entrenadores") {
  const doc = new jsPDF({ orientation: 'portrait' });
  const today = new Date().toLocaleDateString('es-GT');

  const addHeaderFooter = () => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.addImage(logoInstitucional.src, 'PNG', 15, 8, 18, 18);
          doc.addImage(logoFedepotencia.src, 'PNG', doc.internal.pageSize.getWidth() - 33, 8, 18, 18);
          
          doc.setFontSize(16); doc.setTextColor(40);
          doc.setFont('helvetica', 'bold');
          doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
          
          doc.setFontSize(8); doc.setTextColor(150);
          doc.setFont('helvetica', 'normal');
          doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
          doc.text(`Generado el: ${today}`, 14, doc.internal.pageSize.getHeight() - 10);
      }
  };

  const head = [['Nombre Completo', 'Email', 'Teléfono', 'Asociación', 'Estado']];
  const body = entrenadores.map(entrenador => [
      entrenador.nombre_completo,
      entrenador.email || '-',
      entrenador.telefono || '-',
      entrenador.asociacion || '-',
      entrenador.activo ? 'Activo' : 'Inactivo'
  ]);

  const autoTable = (await import('jspdf-autotable')).default;
  autoTable(doc, { startY: 30, head: head, body: body, theme: 'grid', headStyles: { fillColor: [22, 163, 74] }, didDrawPage: () => addHeaderFooter(), margin: { top: 28, bottom: 15 } });
  addHeaderFooter();
  doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}_${today.replace(/\//g, '-')}.pdf`);
}
// --- FIN NUEVA FUNCIÓN ---