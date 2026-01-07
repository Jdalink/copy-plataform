-- Sistema de Gestión para Federación de Powerlifting
-- Base de datos PostgreSQL completa (Versión Corregida con Orden de Creación Lógico y Notificaciones Limpias)

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función para actualizar timestamps automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. TABLA DE ROLES
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE ENTRENADORES
CREATE TABLE IF NOT EXISTS entrenadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    asociacion_departamental VARCHAR(100),
    experiencia INTEGER,
    certificaciones TEXT[],
    especialidades TEXT[],
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA DE ATLETAS
CREATE TABLE IF NOT EXISTS atletas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_identificacion VARCHAR(100),
    nombre_completo VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE,
    sexo VARCHAR(10) CHECK (sexo IN ('Femenino', 'Masculino')),
    etnia VARCHAR(50),
    comunidad_linguistica VARCHAR(100),
    nacionalidad VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(255) NOT NULL UNIQUE,
    direccion_residencia TEXT,
    departamento VARCHAR(100),
    municipio VARCHAR(100),
    asociacion_departamental VARCHAR(100),
    cui VARCHAR(13) UNIQUE, -- Columna para el CUI/DPI
    documento_dpi_frente VARCHAR(500),
    documento_dpi_reverso VARCHAR(500),
    foto_url VARCHAR(500),
    activo BOOLEAN DEFAULT true,
    categoria_peso VARCHAR(20),
    peso_corporal DECIMAL(5,2),
    altura_cm INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    nombre_completo VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    rol_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    foto_url VARCHAR(500),
    -- Campos de perfil del atleta
    fecha_nacimiento DATE,
    sexo VARCHAR(10) CHECK (sexo IN ('Femenino', 'Masculino')),
    telefono VARCHAR(20),
    direccion TEXT,
    cui VARCHAR(13) UNIQUE,
    documento_dpi_frente VARCHAR(500),
    documento_dpi_reverso VARCHAR(500),
    -- Campos de configuración y seguridad
    language VARCHAR(5) DEFAULT 'es',
    theme VARCHAR(10) DEFAULT 'system',
    activo BOOLEAN DEFAULT true,
    eliminado BOOLEAN DEFAULT false,
    email_verificado BOOLEAN DEFAULT false,
    ultimo_login TIMESTAMP,
    primer_login BOOLEAN DEFAULT true,
    -- Nuevos campos de perfil
    etnia VARCHAR(50),
    comunidad_linguistica VARCHAR(100),
    asociacion_departamental VARCHAR(100),
    departamento VARCHAR(100),
    municipio VARCHAR(100),
    autenticacion_2fa BOOLEAN DEFAULT false,
    -- Campos de recuperación y bloqueo (Consistente con la lógica de NextAuth)
    intentos_fallidos INT DEFAULT 0,
    bloqueado_hasta TIMESTAMPTZ,
    token_recuperacion TEXT,
    token_recuperacion_expira TIMESTAMP,
    activation_token VARCHAR(255),
    activation_token_expires TIMESTAMP WITH TIME ZONE,
    token_2fa VARCHAR(255),
    token_2fa_expira TIMESTAMP,
    -- Relaciones (opcionales)
    atleta_id UUID REFERENCES atletas(id) ON DELETE SET NULL,
    entrenador_id UUID REFERENCES entrenadores(id) ON DELETE SET NULL,
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA DE RELACIÓN ENTRENADOR-ATLETA
CREATE TABLE IF NOT EXISTS entrenador_atleta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entrenador_id UUID REFERENCES entrenadores(id) ON DELETE CASCADE,
    atleta_id UUID REFERENCES atletas(id) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entrenador_id, atleta_id, fecha_inicio)
);

-- 6. TABLA DE COMPETENCIAS
CREATE TABLE IF NOT EXISTS competencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    fecha_fin DATE,
    ubicacion VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('Nacional', 'Internacional', 'Regional', 'Local')),
    organizador VARCHAR(255),
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'programada' CHECK (estado IN ('programada', 'en_curso', 'finalizada', 'cancelada')),
    unidades_peso VARCHAR(3) DEFAULT 'kg' CHECK (unidades_peso IN ('kg', 'lb')),
    max_participantes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABLA DE CATEGORÍAS POR COMPETENCIA
CREATE TABLE IF NOT EXISTS competencia_categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competencia_id UUID REFERENCES competencias(id) ON DELETE CASCADE NOT NULL,
    categoria_peso VARCHAR(50) NOT NULL,
    categoria_edad VARCHAR(50) NOT NULL,
    sexo VARCHAR(10) NOT NULL CHECK (sexo IN ('Femenino', 'Masculino')),
    UNIQUE(competencia_id, categoria_peso, categoria_edad, sexo)
);

-- 8. TABLA DE EVENTOS
CREATE TABLE IF NOT EXISTS eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competencia_id UUID REFERENCES competencias(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    categoria_peso VARCHAR(20),
    genero VARCHAR(10) CHECK (genero IN ('Masculino', 'Femenino')),
    fecha DATE NOT NULL,
    orden_evento INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. TABLA DE RESULTADOS
CREATE TABLE IF NOT EXISTS resultados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    atleta_id UUID REFERENCES atletas(id) ON DELETE CASCADE,
    equipamiento VARCHAR(20) DEFAULT 'Classic' CHECK (equipamiento IN ('Classic', 'Equipped')),
    division_edad VARCHAR(20) DEFAULT 'Open',
    sentadilla_mejor DECIMAL(7,2),
    press_banca_mejor DECIMAL(7,2),
    peso_muerto_mejor DECIMAL(7,2),
    total DECIMAL(8,2) GENERATED ALWAYS AS ( COALESCE(sentadilla_mejor, 0) + COALESCE(press_banca_mejor, 0) + COALESCE(peso_muerto_mejor, 0) ) STORED,
    peso_corporal DECIMAL(5,2) NOT NULL,
    unidades_peso VARCHAR(3) DEFAULT 'kg' CHECK (unidades_peso IN ('kg', 'lb')),
    ipf_gl_points_squat DECIMAL(7,4),
    ipf_gl_points_bench DECIMAL(7,4),
    ipf_gl_points_deadlift DECIMAL(7,4),
    ipf_gl_points_total DECIMAL(7,4),
    posicion INTEGER,
    descalificado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(evento_id, atleta_id)
);

-- 10. TABLA DE COEFICIENTES IPF GL
CREATE TABLE IF NOT EXISTS ipf_gl_coefficients (
    id SERIAL PRIMARY KEY,
    sexo VARCHAR(10) NOT NULL,
    equipamiento VARCHAR(20) NOT NULL,
    levantamiento VARCHAR(50) NOT NULL,
    coef_a NUMERIC,
    coef_b NUMERIC,
    coef_c NUMERIC,
    UNIQUE(sexo, equipamiento, levantamiento)
);

-- 11. TABLA DE PLANES DE ENTRENAMIENTO
CREATE TABLE IF NOT EXISTS planes_entrenamiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    atleta_id UUID REFERENCES atletas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    objetivo VARCHAR(100),
    nivel VARCHAR(20),
    frecuencia INTEGER,
    duracion_semanas INTEGER,
    plan_detallado JSONB,
    fecha_inicio DATE,
    activo BOOLEAN DEFAULT true,
    generado_por_ia BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. TABLA DE PLANES DE ALIMENTACIÓN
CREATE TABLE IF NOT EXISTS planes_alimentacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    atleta_id UUID REFERENCES atletas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    objetivo VARCHAR(100),
    calorias_diarias INTEGER,
    macros JSONB,
    plan_detallado JSONB,
    fecha_inicio DATE,
    activo BOOLEAN DEFAULT true,
    generado_por_ia BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. TABLA DE CONFIGURACIÓN
CREATE TABLE IF NOT EXISTS configuracion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    descripcion TEXT,
    tipo VARCHAR(20) DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. TABLA DE ENTRENAMIENTOS
CREATE TABLE IF NOT EXISTS entrenamientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    atleta_id UUID REFERENCES atletas(id) ON DELETE CASCADE NOT NULL,
    plan_entrenamiento_id UUID REFERENCES planes_entrenamiento(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    tipo_entrenamiento VARCHAR(100),
    intensidad VARCHAR(50),
    completado BOOLEAN DEFAULT false,
    ejercicios JSONB,
    semana INTEGER,
    dia VARCHAR(50),
    unidades_peso VARCHAR(3) DEFAULT 'kg' CHECK (unidades_peso IN ('kg', 'lb')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. TABLA DE RENDIMIENTO
CREATE TABLE IF NOT EXISTS rendimiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    atleta_id UUID REFERENCES atletas(id) ON DELETE CASCADE NOT NULL,
    fecha DATE NOT NULL,
    sentadilla DECIMAL(7,2),
    press_banca DECIMAL(7,2),
    peso_muerto DECIMAL(7,2),
    total DECIMAL(8,2),
    tipo_registro VARCHAR(50) CHECK (tipo_registro IN ('entrenamiento', 'competencia')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. TABLA DE INSCRIPCIONES A COMPETENCIAS (MODIFICADA)
CREATE TABLE IF NOT EXISTS competencia_inscripciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competencia_categoria_id UUID REFERENCES competencia_categorias(id) ON DELETE CASCADE NOT NULL,
    atleta_id UUID REFERENCES atletas(id) ON DELETE CASCADE NOT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- CAMBIO: Se añade estado para la aprobación del entrenador
    estado VARCHAR(50) DEFAULT 'Pendiente de Aprobación' NOT NULL, -- Valores: 'Pendiente de Aprobación', 'Aprobado', 'Rechazado'
    UNIQUE(competencia_categoria_id, atleta_id)
);

-- 17. TABLA DE NOTIFICACIONES (NUEVA)
CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT false,
    url_destino VARCHAR(255), -- Opcional: A dónde redirigir al hacer clic
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. TABLA DE HISTORIAL DE CONTRASEÑAS (NUEVA)
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TRIGGERS PARA UPDATED_AT
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entrenadores_updated_at BEFORE UPDATE ON entrenadores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_atletas_updated_at BEFORE UPDATE ON atletas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competencias_updated_at BEFORE UPDATE ON competencias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON eventos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resultados_updated_at BEFORE UPDATE ON resultados FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planes_entrenamiento_updated_at BEFORE UPDATE ON planes_entrenamiento FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planes_alimentacion_updated_at BEFORE UPDATE ON planes_alimentacion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracion_updated_at BEFORE UPDATE ON configuracion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entrenamientos_updated_at BEFORE UPDATE ON entrenamientos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rendimiento_updated_at BEFORE UPDATE ON rendimiento FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_atletas_email ON atletas(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
DROP INDEX IF EXISTS unq_atleta_activo;
CREATE UNIQUE INDEX unq_atleta_activo ON entrenador_atleta (atleta_id) WHERE activo = true;

-- FUNCIÓN PARA CÁLCULO DE PUNTOS IPF GL
CREATE OR REPLACE FUNCTION calcular_ipf_gl_points(p_sexo VARCHAR, p_equipamiento VARCHAR, p_levantamiento VARCHAR, p_peso_corporal DECIMAL, p_total_levantado DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    coef_a NUMERIC; coef_b NUMERIC; coef_c NUMERIC; ipf_gl_score DECIMAL;
BEGIN
    SELECT a.coef_a, a.coef_b, a.coef_c INTO coef_a, coef_b, coef_c
    FROM ipf_gl_coefficients a
    WHERE a.sexo = p_sexo AND a.equipamiento = p_equipamiento AND a.levantamiento = p_levantamiento;
    IF coef_a IS NULL THEN RETURN 0; END IF;
    ipf_gl_score := 100 / (coef_a - coef_b * exp(-coef_c * p_peso_corporal));
    RETURN ROUND((p_total_levantado * ipf_gl_score)::DECIMAL, 4);
END;
$$ LANGUAGE plpgsql;

-- TRIGGER PARA CALCULAR PUNTOS EN RESULTADOS
-- TRIGGER PARA CALCULAR PUNTOS EN RESULTADOS (VERSIÓN MEJORADA)
CREATE OR REPLACE FUNCTION calcular_ipf_gl_trigger()
RETURNS TRIGGER AS $$
DECLARE
    atleta_sexo_full VARCHAR;
BEGIN
    -- Obtener el sexo del atleta una sola vez
    SELECT sexo INTO atleta_sexo_full FROM atletas WHERE id = NEW.atleta_id;

    -- Calcular puntos para cada levantamiento y para el total
    -- Squat y Deadlift usan los coeficientes de 'Powerlifting'
    NEW.ipf_gl_points_squat := calcular_ipf_gl_points(
        atleta_sexo_full, NEW.equipamiento, 'Powerlifting', NEW.peso_corporal, NEW.sentadilla_mejor
    );
    NEW.ipf_gl_points_deadlift := calcular_ipf_gl_points(
        atleta_sexo_full, NEW.equipamiento, 'Powerlifting', NEW.peso_corporal, NEW.peso_muerto_mejor
    );
    
    -- Bench Press usa sus propios coeficientes
    NEW.ipf_gl_points_bench := calcular_ipf_gl_points(
        atleta_sexo_full, NEW.equipamiento, 'Bench Press', NEW.peso_corporal, NEW.press_banca_mejor
    );

    -- El total también usa los coeficientes de 'Powerlifting'
    NEW.ipf_gl_points_total := calcular_ipf_gl_points(
        atleta_sexo_full, NEW.equipamiento, 'Powerlifting', NEW.peso_corporal, NEW.total
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calcular_ipf_gl ON resultados;
CREATE TRIGGER trigger_calcular_ipf_gl BEFORE INSERT OR UPDATE ON resultados FOR EACH ROW EXECUTE FUNCTION calcular_ipf_gl_trigger();

-- VISTAS
DROP VIEW IF EXISTS vista_rankings;
CREATE VIEW vista_rankings AS
SELECT
    r.id,
    a.nombre_completo,
    a.nacionalidad as pais,
    e.categoria_peso,
    a.sexo,
    r.total,
    r.ipf_gl_points_total,
    r.peso_corporal,
    c.nombre as competencia,
    c.fecha
FROM resultados r
JOIN atletas a ON r.atleta_id = a.id
JOIN eventos e ON r.evento_id = e.id
JOIN competencias c ON e.competencia_id = c.id
WHERE r.descalificado = false AND r.total > 0;