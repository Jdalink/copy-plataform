// lib/definitions.ts

export interface Atleta {
  id: string;
  codigo_identificacion: string | null;
  nombre_completo: string;
  fecha_nacimiento: string | null;
  sexo: "Femenino" | "Masculino";
  es_menor: boolean;
  etnia: string | null;
  comunidad_linguistica: string | null;
  nacionalidad: string | null;
  telefono: string | null;
  email: string | null;
  direccion_residencia: string | null;
  departamento: string | null;
  municipio: string | null;
  asociacion_departamental: string | null; // <-- ESTE ES EL NOMBRE OFICIAL EN EL FRONTEND
  documento_dpi_frente?: string | null;
  documento_dpi_reverso?: string | null;
  foto_url: string | null;
  activo: boolean;
  categoria_peso: string | null;
  peso_corporal: number | null;
  altura_cm: number | null;
  created_at?: string;
  updated_at?: string;
  entrenador_nombre_completo?: string | null;
}

export interface Entrenador {
  id: string;
  nombre_completo: string; 
  nombre?: string; 
  apellido?: string;
  email: string;
  telefono?: string | null;
  asociacion?: string | null;
  experiencia?: number | null;
  certificaciones?: string[] | null;
  especialidades?: string[] | null;
  activo: boolean;
}

// --- INTERFACES PARA PÁGINA DE DETALLES DE ATLETA ---

export interface PlanEntrenamiento extends PlanEntrenamientoDetallado {
  id: string;
  fecha_inicio: string | null;
  tipo_plan?: string;
  // nombre: string;
  // objetivo?: string | null;
  // plan_detallado: any;
  // activo?: boolean;
  atleta_id: string;
  atleta_apellido?: string;
}

export interface PlanAlimentacion {
  id: string;
  nombre: string;
  recomendaciones?: string;
  plan_detallado: any; // O una estructura más específica si la tienes
}

export interface PlanNutricional {
  id: string;
  nombre: string;
  objetivo: string;
  fecha_inicio: string;
  plan_detallado: any;
  nutricionista_nombre?: string;
}

export interface Competencia {
  id: string;
  nombre: string;
  fecha: string | null;
  lugar: string;
  total_levantado: number;
}


// --- INTERFACES PARA DASHBOARD Y MÓDULO DE ENTRENADORES ---

export interface AtletaAsignado {
  atleta_id: string;
  nombre_completo: string;
  fecha_inicio: string; 
  activo: boolean; 
  codigo_identificacion?: string | null;
  sexo?: "Femenino" | "Masculino";
  fecha_nacimiento?: string;
  comunidad_linguistica?: string | null;
  etnia?: string | null;
  asociacion_departamental?: string | null; // <-- Nombre correcto
}

export interface EntrenadorDetails {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  asociacion_departamental: string | null;
  experiencia?: number | null;
  certificaciones: string[] | null; 
  especialidades: string[] | null;
  atletasAsignados?: AtletaAsignado[]; // <-- CORRECCIÓN: Añadido para que coincida con la API
  activo: boolean; 
}

export interface ConfiguracionItem {
  id: number;
  clave: string;
  valor: string;
  descripcion?: string | null;
  tipo: 'string' | 'number' | 'boolean' | 'json';
  created_at: string;
  updated_at: string;
}

// --- INTERFACES PARA PLAN DE ENTRENAMIENTO DETALLADO (DASHBOARD ATLETA) ---

export interface PlanDetalladoSemana {
  semana: number;
  dias: PlanDetalladoDia[];
}
export interface PlanDetalladoDia {
  dia: string;
  ejercicios: PlanDetalladoEjercicio[];
  descanso?: boolean;
}
export interface PlanDetalladoEjercicio {
  nombre: string;
  series: PlanDetalladoSerie[];
  notas?: string;
}
export interface PlanDetalladoSerie {
  reps: number | string;
  peso?: number | null;
  rir?: number | null;
  descanso_seg?: number | null;
}

export interface PlanEntrenamientoDetallado {
  id: string;
  atleta_id?: string;
  atleta_nombre?: string;
  atleta_apellido?: string;
  nombre: string;
  objetivo?: string | null;
  nivel?: string | null;
  frecuencia?: number | null;
  duracion_semanas: number;
  plan_detallado: any | PlanDetalladoSemana[] | null | string;
  fecha_inicio?: string | null;
  activo?: boolean;
  generado_por_ia?: boolean;
  created_at?: string;
}