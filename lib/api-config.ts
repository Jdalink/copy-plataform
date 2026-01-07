// lib/api-config.ts

const API_BASE_URL = "/api";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
    ACTIVATE: `${API_BASE_URL}/auth/activate`,
    FORCE_PASSWORD_CHANGE: `${API_BASE_URL}/auth/force-password-change`,
  },
  ATLETAS: {
    LIST: `${API_BASE_URL}/atletas`,
    CREATE: `${API_BASE_URL}/register/athlete`, // Usa la ruta de registro público
    // --- INICIO CORRECCIÓN: Apuntar a la ruta [id] directamente ---
    DETAILS: (id: string) => `${API_BASE_URL}/atletas/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/atletas/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/atletas/${id}`,
    ASSIGN_COACH: (id: string) => `${API_BASE_URL}/atletas/${id}/assign-coach`,
    IMPORT: `${API_BASE_URL}/atletas/import`,
    GET_ACTIVE_PLAN: `${API_BASE_URL}/atletas/me/active-plan`,
    GET_ALIMENTACION_PLAN: `${API_BASE_URL}/atletas/me/alimentacion-plan`,
  },
  ENTRENADORES: {
    LIST: `${API_BASE_URL}/entrenadores`,
    CREATE: `${API_BASE_URL}/entrenadores`,
    // --- INICIO CORRECCIÓN: Apuntar a la ruta [id] ---
    DETAILS: (id: string) => `${API_BASE_URL}/entrenadores/${id}`, 
    // --- FIN CORRECCIÓN ---
    UPDATE: (id: string) => `${API_BASE_URL}/entrenadores/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/entrenadores/${id}`,
    GET_MY_ATLETAS: `${API_BASE_URL}/entrenadores/me/atletas`,
  },
  COMPETENCIAS: {
    LIST: `${API_BASE_URL}/competencias`,
    CREATE: `${API_BASE_URL}/competencias`,
    UPDATE: (id: string) => `${API_BASE_URL}/competencias/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/competencias/${id}`,
    SOLICITAR_INSCRIPCION: (id: string) => `${API_BASE_URL}/competencias/${id}/solicitar-inscripcion`,
    LISTAR_INSCRITOS: (id: string) => `${API_BASE_URL}/competencias/${id}/inscritos`,
    LISTAR_SOLICITUDES_PENDIENTES: `${API_BASE_URL}/competencias/solicitudes/pendientes`,
    ACTUALIZAR_ESTADO_INSCRIPCION: (id: string) => `${API_BASE_URL}/competencias/inscripciones/${id}/estado`,
    // --- INICIO CORRECCIÓN: Añadir el nuevo endpoint ---
    PROXIMAS_PARA_ATLETA: `${API_BASE_URL}/competencias/proximas-para-atleta`,
  },
  RESULTADOS: {
    LIST: `${API_BASE_URL}/resultados`,
    CREATE: `${API_BASE_URL}/resultados`,
    GET_BY_ATLETA: (atletaId: string) => `${API_BASE_URL}/resultados/atleta/${atletaId}`,
  },
  EVENTOS: {
    LIST: `${API_BASE_URL}/eventos`,
  },
  // --- INICIO CORRECCIÓN: Añadir SEGUIMIENTO ---
  SEGUIMIENTO: {
    GET_BY_ATLETA: `${API_BASE_URL}/seguimiento/me`,
    UPDATE: `${API_BASE_URL}/seguimiento`,
  },
  // --- FIN CORRECCIÓN ---
  ENTRENAMIENTOS: {
    LIST: `${API_BASE_URL}/entrenamientos`,
    CREATE: `${API_BASE_URL}/entrenamientos`,
    UPDATE: (id: string) => `${API_BASE_URL}/entrenamientos/${id}`,
  },
  PLANES_ENTRENAMIENTO: {
    LIST: `${API_BASE_URL}/planes-entrenamiento`,
    CREATE: `${API_BASE_URL}/planes-entrenamiento`,
    // --- INICIO CORRECCIÓN: Añadir UPDATE ---
    UPDATE: (id: string) => `${API_BASE_URL}/planes-entrenamiento/${id}`,
    // --- FIN CORRECCIÓN ---
    DELETE: (id: string) => `${API_BASE_URL}/planes-entrenamiento/${id}`,
    GENERATE_WEEK: (id: string) => `${API_BASE_URL}/planes-entrenamiento/${id}/generar-semana`,
  },
  PLANES_ALIMENTACION: {
    LIST: `${API_BASE_URL}/planes-alimentacion`,
    CREATE: `${API_BASE_URL}/planes-alimentacion`,
    DELETE: (id: string) => `${API_BASE_URL}/planes-alimentacion/${id}`,
    DETAILS: (id: string) => `${API_BASE_URL}/planes-alimentacion/${id}`,
  },
  RENDIMIENTO: {
    GET: (atletaId: string) => `${API_BASE_URL}/rendimiento?atletaId=${atletaId}`,
  },
  NOTIFICACIONES: {
    LIST: `${API_BASE_URL}/notificaciones`,
    MARK_AS_READ: `${API_BASE_URL}/notificaciones/marcar-leidas`,
  },
  IA: {
    GENERATE_TRAINING_PLAN: `${API_BASE_URL}/ia/generate-training-plan`,
    GENERATE_DIET_PLAN: `${API_BASE_URL}/ia/generate-diet-plan`,
  },
  REPORTES: {
    ADHERENCIA: `${API_BASE_URL}/reportes/adherencia`,
    // --- INICIO CORRECCIÓN: Añadir reporte ---
    ENTRENADOR_ATLETAS: `${API_BASE_URL}/reportes/entrenador-atletas`,
    // --- FIN CORRECCIÓN ---
  },
  USUARIOS: {
    LIST: `${API_BASE_URL}/usuarios`,
    CREATE: `${API_BASE_URL}/usuarios`,
    UPDATE: (id: string) => `${API_BASE_URL}/usuarios/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/usuarios/${id}`,
  },
  ROLES: {
    LIST: `${API_BASE_URL}/roles`,
  },
  DASHBOARD: {
    STATS: `${API_BASE_URL}/dashboard/stats`,
  },
  CONFIGURACION: {
    LIST: `${API_BASE_URL}/configuracion`,
    UPDATE: `${API_BASE_URL}/configuracion`,
    UPLOAD_LOGO: `${API_BASE_URL}/configuracion/upload-logo`,
  },
  PERFIL: {
    GET: `${API_BASE_URL}/perfil`,
    UPDATE: `${API_BASE_URL}/perfil`,
    CHANGE_PASSWORD: `${API_BASE_URL}/perfil/change-password`,
    UPLOAD_PICTURE: `${API_BASE_URL}/perfil/upload-picture`,
    TOGGLE_2FA: `${API_BASE_URL}/perfil/2fa`,
    VERIFY_2FA: `${API_BASE_URL}/perfil/2fa/verify`,
  },
  RANKINGS: {
    GET: `${API_BASE_URL}/rankings`,
  },
  MEDIA: {
    GET: (path: string) => `${API_BASE_URL}/media/${path.startsWith('/') ? path.substring(1) : path}`,
  }
};