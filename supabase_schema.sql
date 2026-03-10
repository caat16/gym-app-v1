-- Esquema Inicial para Gymflow Pro en Supabase

-- Extensión para IDs únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLA: users (Usuarios de la aplicación)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ci TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'trainer', 'admin')),
    name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar TEXT,
    waiver_signed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- TABLA: biometrics (Historial de medidas)
-- ==========================================
CREATE TABLE IF NOT EXISTS biometrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    weight DECIMAL NOT NULL,
    height DECIMAL NOT NULL,
    bmi DECIMAL NOT NULL
);

-- ==========================================
-- TABLA: personal_records (Récords deportivos)
-- ==========================================
CREATE TABLE IF NOT EXISTS personal_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    exercise_name TEXT NOT NULL,
    value DECIMAL NOT NULL,
    unit TEXT NOT NULL
);

-- ==========================================
-- TABLA: plans (Planes disponibles)
-- ==========================================
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL NOT NULL,
    features TEXT[] -- Arreglo de strings para las características
);

-- ==========================================
-- TABLA: subscriptions (Suscripciones activas)
-- ==========================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'expiring_soon'))
);

-- ==========================================
-- TABLA: routines (Rutinas subidas por entrenadores)
-- ==========================================
CREATE TABLE IF NOT EXISTS routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES users(id), -- Qué entrenador la creó
    assigned_to UUID REFERENCES users(id), -- A qué estudiante está asignada (puede ser nulo si es genérica)
    exercises JSONB NOT NULL, -- Arreglo JSON de ejercicios con reps y sets
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- TABLA: classes (Clases programadas)
-- ==========================================
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    instructor_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    capacity INTEGER NOT NULL
);

-- ==========================================
-- TABLA: class_enrollments (Alumnos inscritos en clases)
-- ==========================================
CREATE TABLE IF NOT EXISTS class_enrollments (
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attended BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (class_id, student_id)
);

-- ==========================================
-- INSERCIÓN DE DATOS INICIALES (MOCKS)
-- ==========================================

-- Insertar el Admin por defecto
INSERT INTO users (id, ci, role, name, last_name, age, email, waiver_signed) 
VALUES (
    uuid_generate_v4(), 
    '1234', 
    'admin', 
    'Administrador', 
    'Gymflow', 
    35, 
    'admin@gymflowpro.com', 
    TRUE
) ON CONFLICT (ci) DO NOTHING;

-- Insertar el Alumno por defecto
INSERT INTO users (id, ci, role, name, last_name, age, email, waiver_signed) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid, 
    '12345678', 
    'student', 
    'Alex', 
    'Arandia', 
    28, 
    'alex@example.com', 
    TRUE
) ON CONFLICT (ci) DO NOTHING;

-- Insertar Entrenador por defecto
INSERT INTO users (id, ci, role, name, last_name, age, email, waiver_signed) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440002'::uuid, 
    '87654321', 
    'trainer', 
    'Carlos', 
    'Coach', 
    35, 
    'carlos@gymflow.com', 
    TRUE
) ON CONFLICT (ci) DO NOTHING;

-- Insertar Planes disponibles
INSERT INTO plans (name, description, price, features) VALUES 
('Plan Mujeres', 'Entrenamiento enfocado en tonificación y fuerza femenina', 29.99, ARRAY['Acceso total', 'Clases grupales']),
('Plan Senior', 'Ejercicios de bajo impacto y movilidad para adultos mayores', 19.99, ARRAY['Horario matutino', 'Asesoría especializada']),
('Plan Calistenia', 'Dominio del peso corporal y gimnasia', 34.99, ARRAY['Zona calistenia', 'Talleres técnicos']),
('Plan Híbrido', 'Combinación de pesas y entrenamiento funcional', 39.99, ARRAY['Acceso 24/7', 'Rutinas personalizadas']),
('Plan Power Plate', 'Entrenamiento de fuerza extrema y powerlifting', 44.99, ARRAY['Equipamiento profesional', 'Zona lifting']);
