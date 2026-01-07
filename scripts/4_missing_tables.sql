-- Crear tabla de planes nutricionales
CREATE TABLE IF NOT EXISTS planes_nutricionales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atleta_id UUID REFERENCES atletas(id),
    nombre VARCHAR(255),
    objetivo TEXT,
    fecha_inicio DATE,
    duracion_semanas INT,
    plan_detallado JSONB,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de competencias
CREATE TABLE IF NOT EXISTS competencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255),
    fecha DATE,
    lugar VARCHAR(255),
    estado VARCHAR(50) DEFAULT 'programada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de resultados de competencia
CREATE TABLE IF NOT EXISTS resultados_competencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competencia_id UUID REFERENCES competencias(id),
    atleta_id UUID REFERENCES atletas(id),
    total DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de categorías de competencia (necesaria para el dashboard)
CREATE TABLE IF NOT EXISTS competencia_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competencia_id UUID REFERENCES competencias(id),
    categoria_peso VARCHAR(50),
    sexo VARCHAR(20)
);