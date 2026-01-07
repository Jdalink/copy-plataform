-- #####################################################################
-- ## Archivo de Datos Iniciales para el Sistema de Gestión de Powerlifting
-- ## Propósito: Poblar la base de datos con datos de ejemplo consistentes
-- ## y completos para una presentación profesional de la plataforma.
-- #####################################################################

-- Se eliminan todos los datos existentes para asegurar un estado limpio.
TRUNCATE TABLE 
    roles, entrenadores, atletas, usuarios, entrenador_atleta,
    competencias, competencia_categorias, eventos, competencia_inscripciones, resultados,
    planes_entrenamiento, planes_alimentacion, entrenamientos, rendimiento, 
    ipf_gl_coefficients, configuracion, notificaciones, password_history
RESTART IDENTITY CASCADE;

-- ====================================================================
-- SECCIÓN 1: DATOS FUNDAMENTALES DEL SISTEMA
-- ====================================================================

-- 1.1: ROLES DE USUARIO
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Control total sobre todos los módulos del sistema.'),
('Entrenador', 'Puede gestionar sus atletas asignados, planes y ver resultados.'),
('Atleta', 'Puede ver su propio perfil, planes de entrenamiento y resultados.'),
('Gerencia', 'Acceso a dashboards y reportes para la toma de decisiones.');

-- 1.2: COEFICIENTES IPF GL
INSERT INTO ipf_gl_coefficients (sexo, equipamiento, levantamiento, coef_a, coef_b, coef_c) VALUES
('Masculino', 'Classic', 'Powerlifting', 1199.72839, 1025.18162, 0.00921),
('Femenino', 'Classic', 'Powerlifting', 610.32796, 1045.59282, 0.03048),
('Masculino', 'Classic', 'Bench Press', 320.98041, 281.40258, 0.01008),
('Femenino', 'Classic', 'Bench Press', 142.40398, 442.52671, 0.04724);

-- 1.3: CONFIGURACIÓN GENERAL
INSERT INTO configuracion (clave, valor, descripcion, tipo) VALUES
('federacion_nombre', 'Federación Nacional de Potencia', 'Nombre que aparecerá en el sidebar y reportes', 'string'),
('max_intentos_login', '5', 'Intentos fallidos antes de bloquear una cuenta', 'number'),
('tiempo_bloqueo_minutos', '15', 'Minutos de bloqueo de cuenta', 'number'),
('notificaciones_email', 'false', 'Habilita el envío de correos electrónicos', 'boolean');

-- ====================================================================
-- SECCIÓN 2: DATOS DE EJEMPLO PARA LOS MÓDULOS
-- ====================================================================

-- 2.1: USUARIOS Y ENTRENADORES
-- Contraseña para todos los usuarios de ejemplo: 'password123'
DO $$
DECLARE
    admin_rol_id INT := (SELECT id FROM roles WHERE nombre = 'Administrador');
    entrenador_rol_id INT := (SELECT id FROM roles WHERE nombre = 'Entrenador');
    atleta_rol_id INT := (SELECT id FROM roles WHERE nombre = 'Atleta');
    -- Hash para 'password123'
    pass_hash TEXT := '$2b$10$cuUVsCthrqJU.dxcjHi7xOLz7QV3u/wbxs8ooXtmat5kIwJAuL/QG';
    
    entrenador_julio_id UUID;
    entrenador_mariana_id UUID;
    atleta_leslie_id UUID;
    atleta_dany_id UUID;
    atleta_mercy_id UUID;

    -- IDs para atletas adicionales que se usan en resultados e inscripciones
    atleta_carlos_id UUID;
    atleta_juan_id UUID;
    atleta_luis_id UUID;
    atleta_ana_id UUID;
    atleta_maria_id UUID;
    atleta_laura_id UUID;
BEGIN
    -- Crear usuario Administrador
    INSERT INTO usuarios (nombre_usuario, nombre_completo, email, contrasena_hash, rol_id) VALUES
    ('admin', 'Admin Principal', 'admin@powerfed.com', pass_hash, admin_rol_id),
    ('jequite', 'Jason Equite', 'jequitem@miumg.edu.gt', pass_hash, admin_rol_id);

    -- Crear Entrenadores
    INSERT INTO entrenadores (nombre, apellido, email, especialidades, asociacion_departamental) VALUES
    ('Julio', 'Díaz', 'julio.diaz@powerfed.com', ARRAY['Periodización', 'Fuerza Máxima'], 'Asociación de Guatemala') RETURNING id INTO entrenador_julio_id;
    INSERT INTO entrenadores (nombre, apellido, email, especialidades, asociacion_departamental) VALUES ('Mariana', 'García', 'mariana.garcia@powerfed.com', ARRAY['Técnica', 'Rehabilitación'], 'Asociación de Quetzaltenango') RETURNING id INTO entrenador_mariana_id;

    -- Crear usuarios para Entrenadores
    INSERT INTO usuarios (nombre_usuario, nombre_completo, email, contrasena_hash, rol_id, entrenador_id) VALUES
    ('jdiaz', 'Julio Díaz', 'julio.diaz@powerfed.com', pass_hash, entrenador_rol_id, entrenador_julio_id),
    ('mgarcia', 'Mariana García', 'mariana.garcia@powerfed.com', pass_hash, entrenador_rol_id, entrenador_mariana_id);

    -- Crear Atletas
    INSERT INTO atletas (nombre_completo, fecha_nacimiento, sexo, email, categoria_peso, peso_corporal, altura_cm, asociacion_departamental) VALUES
    ('Leslie Granados', '1998-05-20', 'Femenino', 'leslie.granados@email.com', '-57kg', 56.8, 160, 'Asociación de Guatemala') RETURNING id INTO atleta_leslie_id;
    INSERT INTO atletas (nombre_completo, fecha_nacimiento, sexo, email, categoria_peso, peso_corporal, altura_cm, asociacion_departamental) VALUES
    ('Dany Mazariegos', '1995-11-10', 'Masculino', 'dany.mazariegos@email.com', '-83kg', 82.5, 175, 'Asociación de Quetzaltenango') RETURNING id INTO atleta_dany_id;
    INSERT INTO atletas (nombre_completo, fecha_nacimiento, sexo, email, categoria_peso, peso_corporal, altura_cm, asociacion_departamental) VALUES
    ('Mercy Hernandez', '2001-02-15', 'Femenino', 'mercy.hernandez@email.com', '-63kg', 62.1, 165, 'Asociación de Sacatepequez') RETURNING id INTO atleta_mercy_id;

    -- Crear los atletas adicionales que se usarán más adelante
    INSERT INTO atletas (nombre_completo, fecha_nacimiento, sexo, email, categoria_peso, peso_corporal, asociacion_departamental) VALUES 
    ('Carlos Perez', '1996-08-10', 'Masculino', 'carlos.perez@example.com', '-83kg', 82.8, 'Asociación de Quetzaltenango') RETURNING id INTO atleta_carlos_id;
    INSERT INTO atletas (nombre_completo, fecha_nacimiento, sexo, email, categoria_peso, peso_corporal, asociacion_departamental) VALUES 
    ('Juan Gonzalez', '2002-04-22', 'Masculino', 'juan.gonzalez@example.com', '-74kg', 73.5, 'Asociación de Guatemala') RETURNING id INTO atleta_juan_id;
    INSERT INTO atletas (nombre_completo, fecha_nacimiento, sexo, email, categoria_peso, peso_corporal, asociacion_departamental) VALUES 
    ('Luis Martinez', '1999-12-01', 'Masculino', 'luis.martinez@example.com', '-93kg', 92.1, 'Asociación de San Marcos') RETURNING id INTO atleta_luis_id;
    INSERT INTO atletas (nombre_completo, fecha_nacimiento, sexo, email, categoria_peso, peso_corporal, asociacion_departamental) VALUES 
    ('Ana Gomez', '1997-03-15', 'Femenino', 'ana.gomez@example.com', '-57kg', 56.9, 'Asociación de Guatemala') RETURNING id INTO atleta_ana_id;
    INSERT INTO atletas (nombre_completo, fecha_nacimiento, sexo, email, categoria_peso, peso_corporal, asociacion_departamental) VALUES 
    ('Maria Rodriguez', '2003-07-30', 'Femenino', 'maria.rodriguez@example.com', '-52kg', 51.8, 'Asociación de Jalapa') RETURNING id INTO atleta_maria_id;
    INSERT INTO atletas (nombre_completo, fecha_nacimiento, sexo, email, categoria_peso, peso_corporal, asociacion_departamental) VALUES 
    ('Laura Castillo', '1995-01-25', 'Femenino', 'laura.castillo@example.com', '-57kg', 56.2, 'Asociación de Guatemala') RETURNING id INTO atleta_laura_id;

    -- Crear usuarios para Atletas
    INSERT INTO usuarios (nombre_usuario, nombre_completo, email, contrasena_hash, rol_id, atleta_id) VALUES
    ('lgranados', 'Leslie Granados', 'leslie.granados@email.com', pass_hash, atleta_rol_id, atleta_leslie_id),
    ('dmazariegos', 'Dany Mazariegos', 'dany.mazariegos@email.com', pass_hash, atleta_rol_id, atleta_dany_id),
    ('mhernandez', 'Mercy Hernandez', 'mercy.hernandez@email.com', pass_hash, atleta_rol_id, atleta_mercy_id);
    
    -- Crear usuarios para atletas adicionales
    INSERT INTO usuarios (nombre_usuario, nombre_completo, email, contrasena_hash, rol_id, atleta_id) VALUES
    ('cperez', 'Carlos Perez', 'carlos.perez@example.com', pass_hash, atleta_rol_id, atleta_carlos_id),
    ('jgonzalez', 'Juan Gonzalez', 'juan.gonzalez@example.com', pass_hash, atleta_rol_id, atleta_juan_id),
    ('lmartinez', 'Luis Martinez', 'luis.martinez@example.com', pass_hash, atleta_rol_id, atleta_luis_id),
    ('agomez', 'Ana Gomez', 'ana.gomez@example.com', pass_hash, atleta_rol_id, atleta_ana_id),
    ('mrodriguez', 'Maria Rodriguez', 'maria.rodriguez@example.com', pass_hash, atleta_rol_id, atleta_maria_id),
    ('lcastillo', 'Laura Castillo', 'laura.castillo@example.com', pass_hash, atleta_rol_id, atleta_laura_id);

    -- Asignar Atletas a Entrenadores
    INSERT INTO entrenador_atleta (entrenador_id, atleta_id, fecha_inicio) VALUES
    (entrenador_julio_id, atleta_leslie_id, '2023-01-01'),
    (entrenador_mariana_id, atleta_dany_id, '2023-03-15'),
    (entrenador_julio_id, atleta_mercy_id, '2023-06-01');
END $$;


-- 2.2: COMPETENCIAS, EVENTOS Y RESULTADOS
DO $$
DECLARE
    comp_nacional_id UUID;
    comp_regional_id UUID;
    comp_futura_id UUID;
    evento_nacional_leslie_id UUID;
    evento_regional_dany_id UUID;
    cat_futura_leslie_id UUID;
    cat_futura_mercy_id UUID;

    atleta_leslie_id_var UUID := (SELECT id FROM atletas WHERE email = 'leslie.granados@email.com');
    atleta_dany_id_var UUID := (SELECT id FROM atletas WHERE email = 'dany.mazariegos@email.com');
    atleta_mercy_id_var UUID := (SELECT id FROM atletas WHERE email = 'mercy.hernandez@email.com');

    -- IDs para atletas adicionales
    atleta_ana_id_var UUID := (SELECT id FROM atletas WHERE email = 'ana.gomez@example.com');
    atleta_carlos_id_var UUID := (SELECT id FROM atletas WHERE email = 'carlos.perez@example.com');
    atleta_laura_id_var UUID := (SELECT id FROM atletas WHERE email = 'laura.castillo@example.com');
BEGIN
    -- Competencias Finalizadas
    INSERT INTO competencias (nombre, fecha, ubicacion, tipo, estado) VALUES 
    ('Campeonato Nacional Classic 2023', '2023-11-15', 'Ciudad de Guatemala', 'Nacional', 'finalizada') RETURNING id INTO comp_nacional_id;
    INSERT INTO competencias (nombre, fecha, ubicacion, tipo, estado) VALUES 
    ('Torneo Regional Occidente', '2024-02-20', 'Quetzaltenango', 'Regional', 'finalizada') RETURNING id INTO comp_regional_id;

    -- Competencia Programada
    INSERT INTO competencias (nombre, fecha, ubicacion, tipo, estado) VALUES 
    ('Copa de Verano 2024', '2024-08-10', 'Escuintla', 'Nacional', 'programada') RETURNING id INTO comp_futura_id;
    -- Crear eventos para competencias finalizadas
    INSERT INTO eventos (competencia_id, nombre, categoria_peso, genero, fecha) VALUES
    (comp_nacional_id, 'Powerlifting Femenino -57kg', '-57kg', 'Femenino', '2023-11-15') RETURNING id INTO evento_nacional_leslie_id;
    INSERT INTO eventos (competencia_id, nombre, categoria_peso, genero, fecha) VALUES
    (comp_regional_id, 'Powerlifting Masculino -83kg', '-83kg', 'Masculino', '2024-02-20') RETURNING id INTO evento_regional_dany_id;

    -- Insertar resultados asociados a eventos
    INSERT INTO resultados (evento_id, atleta_id, peso_corporal, sentadilla_mejor, press_banca_mejor, peso_muerto_mejor, posicion) VALUES
    (evento_nacional_leslie_id, atleta_leslie_id_var, 56.5, 110, 65, 130, 1);
    INSERT INTO resultados (evento_id, atleta_id, peso_corporal, sentadilla_mejor, press_banca_mejor, peso_muerto_mejor, posicion) VALUES
    (evento_regional_dany_id, atleta_dany_id_var, 82.1, 210, 140, 250, 2);
    -- Más resultados para poblar la tabla
    INSERT INTO resultados (evento_id, atleta_id, peso_corporal, sentadilla_mejor, press_banca_mejor, peso_muerto_mejor, posicion) VALUES
    (evento_nacional_leslie_id, atleta_ana_id_var, 56.9, 105, 60, 125, 2),
    (evento_regional_dany_id, atleta_carlos_id_var, 82.8, 200, 135, 240, 3);

    -- Crear categorías para la competencia futura
    INSERT INTO competencia_categorias (competencia_id, categoria_peso, categoria_edad, sexo) VALUES
    (comp_futura_id, '-57kg', 'Open (24-39)', 'Femenino') RETURNING id INTO cat_futura_leslie_id;
    INSERT INTO competencia_categorias (competencia_id, categoria_peso, categoria_edad, sexo) VALUES
    (comp_futura_id, '-63kg', 'Junior (19-23)', 'Femenino') RETURNING id INTO cat_futura_mercy_id;

    -- Inscripciones para la competencia futura
    INSERT INTO competencia_inscripciones (competencia_categoria_id, atleta_id, estado) VALUES
    (cat_futura_leslie_id, atleta_leslie_id_var, 'Pendiente de Aprobación');
    INSERT INTO competencia_inscripciones (competencia_categoria_id, atleta_id, estado) VALUES
    (cat_futura_mercy_id, atleta_mercy_id_var, 'Aprobado');
    -- Más inscripciones para la competencia futura
    INSERT INTO competencia_inscripciones (competencia_categoria_id, atleta_id, estado) VALUES
    (cat_futura_leslie_id, atleta_laura_id_var, 'Aprobado');
END $$;

-- 2.3: PLANES DE ENTRENAMIENTO Y ALIMENTACIÓN
DO $$
DECLARE
    atleta_leslie_id_var UUID := (SELECT id FROM atletas WHERE email = 'leslie.granados@email.com');
    atleta_dany_id_var UUID := (SELECT id FROM atletas WHERE email = 'dany.mazariegos@email.com');
    plan_fuerza_id UUID;
    plan_peaking_id UUID;
BEGIN
    INSERT INTO planes_entrenamiento (atleta_id, nombre, objetivo, nivel, duracion_semanas, plan_detallado) VALUES
    (atleta_leslie_id_var, 'Bloque de Fuerza General', 'Fuerza', 'Intermedio', 8,
    '{"semana_1":{"dia_1":{"enfoque":"Sentadilla y Accesorios","ejercicios":[{"nombre":"Sentadilla","series_reps":"4x5"},{"nombre":"Prensa","series_reps":"3x10"}]}}}') RETURNING id INTO plan_fuerza_id;

    INSERT INTO planes_entrenamiento (atleta_id, nombre, objetivo, nivel, duracion_semanas, plan_detallado, activo) VALUES
    (atleta_dany_id_var, 'Puesta a Punto Pre-Competencia', 'Peaking', 'Avanzado', 6,
    '{"semana_1":{"dia_1":{"enfoque":"Singles Pesados","ejercicios":[{"nombre":"Peso Muerto","series_reps":"5x1, RPE 8"}]}}}', true) RETURNING id INTO plan_peaking_id;

    -- Seguimiento para el plan de Dany
    INSERT INTO entrenamientos (plan_entrenamiento_id, atleta_id, fecha, semana, dia, completado) VALUES
    (plan_peaking_id, atleta_dany_id_var, '2024-05-20', 1, 'dia_1', true);
    
    INSERT INTO planes_alimentacion (atleta_id, nombre, objetivo, calorias_diarias, plan_detallado) VALUES
    (atleta_leslie_id_var, 'Mantenimiento', 'Mantener peso', 2200,
    '{"desayuno":{"horario":"08:00","alimentos":[{"nombre":"Avena","cantidad":"50g"},{"nombre":"Proteína Whey","cantidad":"1 scoop"}]}}');
    
    INSERT INTO planes_alimentacion (atleta_id, nombre, objetivo, calorias_diarias, plan_detallado) VALUES
    (atleta_dany_id_var, 'Volumen Limpio', 'Aumentar masa', 3500,
    '{"almuerzo":{"horario":"13:00","alimentos":[{"nombre":"Pechuga de pollo","cantidad":"200g"},{"nombre":"Arroz","cantidad":"150g"}]}}');
END $$;

-- ====================================================================
-- SECCIÓN 3: DATOS ADICIONALES PARA VOLUMEN
-- ====================================================================
DO $$
DECLARE
    pass_hash TEXT := '$2b$10$cuUVsCthrqJU.dxcjHi7xOLz7QV3u/wbxs8ooXtmat5kIwJAuL/QG';
    entrenador_rol_id INT := (SELECT id FROM roles WHERE nombre = 'Entrenador');
    atleta_rol_id INT := (SELECT id FROM roles WHERE nombre = 'Atleta');
    
    entrenador_ricardo_id UUID;
    entrenador_sofia_id UUID;
    entrenador_david_id UUID;
    entrenador_elena_id UUID;

    entrenador_julio_id UUID := (SELECT id FROM entrenadores WHERE email = 'julio.diaz@powerfed.com');
    entrenador_mariana_id UUID := (SELECT id FROM entrenadores WHERE email = 'mariana.garcia@powerfed.com');

    atleta_id_temp UUID;
    atleta_nombre_temp TEXT;
    atleta_email_temp TEXT;
    atleta_usuario_temp TEXT;
BEGIN
    -- 3.1: MÁS ENTRENADORES
    INSERT INTO entrenadores (nombre, apellido, email, especialidades, asociacion_departamental) VALUES ('Ricardo', 'Morales', 'ricardo.morales@powerfed.com', ARRAY['Peaking', 'Nutrición'], 'Asociación de San Marcos') RETURNING id INTO entrenador_ricardo_id;
    INSERT INTO entrenadores (nombre, apellido, email, especialidades, asociacion_departamental) VALUES ('Sofia', 'Castillo', 'sofia.castillo@powerfed.com', ARRAY['Biomecánica'], 'Asociación de Jalapa') RETURNING id INTO entrenador_sofia_id;
    INSERT INTO entrenadores (nombre, apellido, email, especialidades, asociacion_departamental) VALUES ('David', 'Reyes', 'david.reyes@powerfed.com', ARRAY['Fuerza General'], 'Asociación de Escuintla') RETURNING id INTO entrenador_david_id;
    INSERT INTO entrenadores (nombre, apellido, email, especialidades, asociacion_departamental) VALUES ('Elena', 'Paz', 'elena.paz@powerfed.com', ARRAY['Psicología Deportiva'], 'Asociación de Guatemala') RETURNING id INTO entrenador_elena_id;

    -- Bucle para generar 34 atletas más (para un total de 40 nuevos)
    FOR i IN 1..34 LOOP
        atleta_nombre_temp := 'Atleta ' || i;
        atleta_email_temp := 'atleta.' || i || '@example.com';
        atleta_usuario_temp := 'atleta' || i;
        IF i % 2 = 0 THEN -- Atleta Masculino
            INSERT INTO atletas (nombre_completo, fecha_nacimiento, sexo, email, categoria_peso, peso_corporal, asociacion_departamental) VALUES
            (atleta_nombre_temp, '1998-01-01'::date + (i*20 || ' days')::interval, 'Masculino', atleta_email_temp, '-83kg', 80.0 + (i*0.1), 'Sin Asociación')
            RETURNING id INTO atleta_id_temp;
        ELSE -- Atleta Femenino
            INSERT INTO atletas (nombre_completo, fecha_nacimiento, sexo, email, categoria_peso, peso_corporal, asociacion_departamental) VALUES
            (atleta_nombre_temp, '1999-01-01'::date + (i*20 || ' days')::interval, 'Femenino', atleta_email_temp, '-63kg', 60.0 + (i*0.1), 'Sin Asociación')
            RETURNING id INTO atleta_id_temp;
        END IF;

        INSERT INTO usuarios (nombre_usuario, nombre_completo, email, contrasena_hash, rol_id, atleta_id) VALUES
        (atleta_usuario_temp, atleta_nombre_temp, atleta_email_temp, pass_hash, atleta_rol_id, atleta_id_temp);
    
    INSERT INTO usuarios (nombre_usuario, nombre_completo, email, contrasena_hash, rol_id, entrenador_id) VALUES
    ('rmorales', 'Ricardo Morales', 'ricardo.morales@powerfed.com', pass_hash, entrenador_rol_id, entrenador_ricardo_id),
    ('scastillo', 'Sofia Castillo', 'sofia.castillo@powerfed.com', pass_hash, entrenador_rol_id, entrenador_sofia_id),
    ('dreyes', 'David Reyes', 'david.reyes@powerfed.com', pass_hash, entrenador_rol_id, entrenador_david_id),
    ('epaz', 'Elena Paz', 'elena.paz@powerfed.com', pass_hash, entrenador_rol_id, entrenador_elena_id);

        -- Asignar a un entrenador de forma rotativa
        CASE (i % 6)
            WHEN 0 THEN INSERT INTO entrenador_atleta (entrenador_id, atleta_id, fecha_inicio) VALUES (entrenador_julio_id, atleta_id_temp, '2023-10-01');
            WHEN 1 THEN INSERT INTO entrenador_atleta (entrenador_id, atleta_id, fecha_inicio) VALUES (entrenador_mariana_id, atleta_id_temp, '2023-10-01');
            WHEN 2 THEN INSERT INTO entrenador_atleta (entrenador_id, atleta_id, fecha_inicio) VALUES (entrenador_ricardo_id, atleta_id_temp, '2023-10-01');
            WHEN 3 THEN INSERT INTO entrenador_atleta (entrenador_id, atleta_id, fecha_inicio) VALUES (entrenador_sofia_id, atleta_id_temp, '2023-10-01');
            WHEN 4 THEN INSERT INTO entrenador_atleta (entrenador_id, atleta_id, fecha_inicio) VALUES (entrenador_david_id, atleta_id_temp, '2023-10-01');
            ELSE INSERT INTO entrenador_atleta (entrenador_id, atleta_id, fecha_inicio) VALUES (entrenador_elena_id, atleta_id_temp, '2023-10-01');
        END CASE;
    -- 3.2: ASIGNACIÓN DE ENTRENADORES A ATLETAS ADICIONALES
    INSERT INTO entrenador_atleta (entrenador_id, atleta_id, fecha_inicio) VALUES 
    (entrenador_mariana_id, (SELECT id FROM atletas WHERE email = 'carlos.perez@example.com'), '2023-02-01'),
    (entrenador_julio_id, (SELECT id FROM atletas WHERE email = 'juan.gonzalez@example.com'), '2023-05-10'),
    (entrenador_ricardo_id, (SELECT id FROM atletas WHERE email = 'luis.martinez@example.com'), '2023-07-20'),
    (entrenador_julio_id, (SELECT id FROM atletas WHERE email = 'ana.gomez@example.com'), '2022-11-01'),
    (entrenador_sofia_id, (SELECT id FROM atletas WHERE email = 'maria.rodriguez@example.com'), '2023-08-01'),
    (entrenador_elena_id, (SELECT id FROM atletas WHERE email = 'laura.castillo@example.com'), '2023-09-15');
    END LOOP;
END $$;

-- ====================================================================
-- SECCIÓN 4: DATOS HISTÓRICOS DE RENDIMIENTO PARA GRÁFICAS
-- ====================================================================
DO $$
DECLARE
    atleta_leslie_id_var UUID := (SELECT id FROM atletas WHERE email = 'leslie.granados@email.com');
    atleta_dany_id_var UUID := (SELECT id FROM atletas WHERE email = 'dany.mazariegos@email.com');
    atleta_mercy_id_var UUID := (SELECT id FROM atletas WHERE email = 'mercy.hernandez@email.com');
    
    sentadilla_val DECIMAL;
    press_banca_val DECIMAL;
    peso_muerto_val DECIMAL;
BEGIN
    -- Historial para Leslie Granados (progresión hacia su competencia de Nov 2023)
    FOR i IN 1..5 LOOP
        sentadilla_val := 90 + (i * 3.5);
        press_banca_val := 55 + (i * 1.5);
        peso_muerto_val := 110 + (i * 3.5);
        INSERT INTO rendimiento (atleta_id, fecha, sentadilla, press_banca, peso_muerto, total, tipo_registro) VALUES
        (atleta_leslie_id_var, '2023-06-15'::date + (i || ' months')::interval, sentadilla_val, press_banca_val, peso_muerto_val, (sentadilla_val + press_banca_val + peso_muerto_val), 'entrenamiento');
    END LOOP;
    -- Registro de su competencia
    INSERT INTO rendimiento (atleta_id, fecha, sentadilla, press_banca, peso_muerto, total, tipo_registro) VALUES
    (atleta_leslie_id_var, '2023-11-15', 110, 65, 130, 305, 'competencia');

    -- Historial para Dany Mazariegos (progresión hacia su competencia de Feb 2024)
    FOR i IN 1..5 LOOP
        sentadilla_val := 185 + (i * 4);
        press_banca_val := 125 + (i * 2.5);
        peso_muerto_val := 225 + (i * 4);
        INSERT INTO rendimiento (atleta_id, fecha, sentadilla, press_banca, peso_muerto, total, tipo_registro) VALUES
        (atleta_dany_id_var, '2023-09-20'::date + (i || ' months')::interval, sentadilla_val, press_banca_val, peso_muerto_val, (sentadilla_val + press_banca_val + peso_muerto_val), 'entrenamiento');
    END LOOP;
    INSERT INTO rendimiento (atleta_id, fecha, sentadilla, press_banca, peso_muerto, total, tipo_registro) VALUES
    (atleta_dany_id_var, '2024-02-20', 210, 140, 250, 600, 'competencia');

    -- Historial para Mercy Hernandez (entrenamiento general)
    INSERT INTO rendimiento (atleta_id, fecha, sentadilla, press_banca, peso_muerto, total, tipo_registro) VALUES
    (atleta_mercy_id_var, '2024-01-10', 80, 50, 95, 225, 'entrenamiento'),
    (atleta_mercy_id_var, '2024-02-12', 85, 52.5, 100, 237.5, 'entrenamiento'),
    (atleta_mercy_id_var, '2024-03-15', 87.5, 55, 105, 247.5, 'entrenamiento'),
    (atleta_mercy_id_var, '2024-04-18', 90, 55, 110, 255, 'entrenamiento'),
    (atleta_mercy_id_var, '2024-05-20', 92.5, 57.5, 112.5, 262.5, 'entrenamiento');
END $$;
