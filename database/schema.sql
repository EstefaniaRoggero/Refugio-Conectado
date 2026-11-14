-- ============================================================
-- Refugio Conectado - Esquema alineado al diagrama ERD
-- Incluye tablas del modelo + extensiones del sistema web
-- ============================================================

CREATE DATABASE IF NOT EXISTS refugio_conectado CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE refugio_conectado;

-- Orden de eliminación (dependencias hijas primero)
DROP TABLE IF EXISTS favoritos;
DROP TABLE IF EXISTS historial_medico_mascota;
DROP TABLE IF EXISTS mascota_imagenes;
DROP TABLE IF EXISTS solicitudes_adopcion;
DROP TABLE IF EXISTS donaciones;
DROP TABLE IF EXISTS voluntarios;
DROP TABLE IF EXISTS perfiles_adoptante;
DROP TABLE IF EXISTS mensajes;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS registros_actividad;
DROP TABLE IF EXISTS invitaciones_admin;
DROP TABLE IF EXISTS usuarios_refugios;
DROP TABLE IF EXISTS citas_visita;
DROP TABLE IF EXISTS mascotas;
DROP TABLE IF EXISTS razas;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS refugios;
DROP TABLE IF EXISTS tipos_donacion;
DROP TABLE IF EXISTS metodos_pago;
DROP TABLE IF EXISTS estados_solicitud_adopcion;
DROP TABLE IF EXISTS estados_mascota;
DROP TABLE IF EXISTS tipos_mascota;
DROP TABLE IF EXISTS tipos_vivienda;
DROP TABLE IF EXISTS roles;

-- ============================================================
-- TABLAS CATÁLOGO (lookup) — según diagrama ERD
-- ============================================================

CREATE TABLE roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre_rol VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipos_vivienda (
  id_tipo_vivienda INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255),
  tiene_patio TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipos_mascota (
  id_tipo_mascota INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  codigo VARCHAR(30) NOT NULL UNIQUE COMMENT 'Slug para API: perro, gato, otro',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Razas ligadas al tipo de mascota (perro, gato, etc.)
CREATE TABLE razas (
  id_raza INT AUTO_INCREMENT PRIMARY KEY,
  id_tipo_mascota INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(50),
  descripcion VARCHAR(255),
  tamano_tipico ENUM('pequeño', 'mediano', 'grande') COMMENT 'Tamaño habitual de la raza',
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_tipo_mascota) REFERENCES tipos_mascota(id_tipo_mascota) ON DELETE CASCADE,
  UNIQUE KEY uk_raza_tipo (id_tipo_mascota, nombre)
);

CREATE TABLE estados_mascota (
  id_estado_mascota INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  codigo VARCHAR(30) NOT NULL UNIQUE COMMENT 'Slug: disponible, en_proceso, adoptado, reservado',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE estados_solicitud_adopcion (
  id_estado_solicitud INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  codigo VARCHAR(30) NOT NULL UNIQUE COMMENT 'Slug: pendiente, aprobada, rechazada',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipos_donacion (
  id_tipo_donacion INT AUTO_INCREMENT PRIMARY KEY,
  tipo_de_donacion VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  cantidad_sugerida INT COMMENT 'Cantidad sugerida (ej. bolsas de alimento)',
  monto_sugerido DECIMAL(10, 2) COMMENT 'Monto sugerido en COP',
  codigo VARCHAR(30) UNIQUE COMMENT 'unica, mensual, alimento, medicina, infraestructura',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE metodos_pago (
  id_metodo_pago INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  codigo VARCHAR(30) NOT NULL UNIQUE COMMENT 'mercadopago, tarjeta, transferencia',
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- REFUGIO — entidad central del diagrama (faltaba en v1)
-- ============================================================

CREATE TABLE refugios (
  id_refugio INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  slug VARCHAR(80) UNIQUE,
  direccion VARCHAR(255),
  descripcion TEXT,
  telefono VARCHAR(30),
  email VARCHAR(150),
  ciudad VARCHAR(100) DEFAULT NULL,
  latitud DECIMAL(10, 7) NULL,
  longitud DECIMAL(10, 7) NULL,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- USUARIO + PERFIL ADOPTANTE (IA) — según diagrama
-- ============================================================

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NULL COMMENT 'NULL si ingresa con Google',
  google_id VARCHAR(255) UNIQUE,
  auth_provider ENUM('local', 'google') DEFAULT 'local',
  id_rol INT NOT NULL DEFAULT 2,
  id_refugio INT NULL,
  telefono VARCHAR(30),
  direccion VARCHAR(255),
  id_tipo_vivienda INT,
  experiencia_mascotas TEXT,
  avatar VARCHAR(255),
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
  FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE SET NULL,
  FOREIGN KEY (id_tipo_vivienda) REFERENCES tipos_vivienda(id_tipo_vivienda) ON DELETE SET NULL
);

CREATE TABLE usuarios_refugios (
  id_usuario INT NOT NULL,
  id_refugio INT NOT NULL,
  es_principal TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_refugio),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE CASCADE
);

CREATE TABLE registros_actividad (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NULL,
  id_refugio INT NULL,
  rol_actor VARCHAR(50),
  accion VARCHAR(120) NOT NULL,
  entidad VARCHAR(80),
  entidad_id VARCHAR(100),
  resultado ENUM('exito', 'error') DEFAULT 'exito',
  datos JSON,
  ip VARCHAR(64),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE SET NULL
);

CREATE TABLE invitaciones_admin (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE perfiles_adoptante (
  id_perfil INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL UNIQUE,
  id_tipo_vivienda INT,
  tiempo_disponible VARCHAR(100) COMMENT 'Para recomendador IA',
  experiencia TEXT,
  actividad_fisica ENUM('baja', 'media', 'alta') DEFAULT 'media',
  espacio_disponible ENUM('pequeño', 'mediano', 'grande') DEFAULT 'mediano',
  tiene_ninos ENUM('si', 'no', 'tal_vez') DEFAULT 'no',
  otras_mascotas ENUM('si', 'no') DEFAULT 'no',
  preferencia_tipo_mascota INT COMMENT 'FK opcional a tipos_mascota',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_tipo_vivienda) REFERENCES tipos_vivienda(id_tipo_vivienda) ON DELETE SET NULL,
  FOREIGN KEY (preferencia_tipo_mascota) REFERENCES tipos_mascota(id_tipo_mascota) ON DELETE SET NULL
);

CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ============================================================
-- MASCOTA — normalizada con FKs del diagrama
-- ============================================================

CREATE TABLE mascotas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  id_tipo_mascota INT NOT NULL,
  id_raza INT,
  id_estado_mascota INT NOT NULL,
  id_refugio INT NOT NULL,
  descripcion TEXT,
  historia TEXT,
  edad INT,
  edad_unidad ENUM('meses', 'años') DEFAULT 'años',
  tamano ENUM('pequeño', 'mediano', 'grande') NOT NULL,
  nivel_energia ENUM('baja', 'media', 'alta') DEFAULT 'media',
  sexo ENUM('macho', 'hembra') NOT NULL,
  imagen VARCHAR(255),
  vacunas TEXT,
  estado_medico TEXT,
  personalidad TEXT,
  comportamiento TEXT,
  compatible_ninos TINYINT(1) DEFAULT 1,
  compatible_mascotas TINYINT(1) DEFAULT 1,
  destacada TINYINT(1) DEFAULT 0,
  publicada TINYINT(1) DEFAULT 1,
  fecha_ingreso DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_tipo_mascota) REFERENCES tipos_mascota(id_tipo_mascota),
  FOREIGN KEY (id_raza) REFERENCES razas(id_raza) ON DELETE SET NULL,
  FOREIGN KEY (id_estado_mascota) REFERENCES estados_mascota(id_estado_mascota),
  FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio)
);

-- Historial médico por mascota (vacunas, cirugías, consultas)
CREATE TABLE historial_medico_mascota (
  id_historial INT AUTO_INCREMENT PRIMARY KEY,
  id_mascota INT NOT NULL,
  tipo ENUM('vacuna', 'cirugia', 'consulta', 'desparasitacion', 'esterilizacion', 'tratamiento', 'otro') NOT NULL,
  procedimiento VARCHAR(150) NOT NULL COMMENT 'Nombre de vacuna, cirugía o procedimiento',
  descripcion TEXT,
  fecha DATE NOT NULL,
  veterinario VARCHAR(150),
  proxima_dosis DATE COMMENT 'Próxima vacuna o control',
  lote VARCHAR(50) COMMENT 'Lote de vacuna si aplica',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_mascota) REFERENCES mascotas(id) ON DELETE CASCADE
);

CREATE TABLE mascota_imagenes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  url VARCHAR(255) NOT NULL,
  orden INT DEFAULT 0,
  FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE
);

-- ============================================================
-- SOLICITUD ADOPCIÓN — según diagrama
-- ============================================================

CREATE TABLE solicitudes_adopcion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_mascota INT NOT NULL,
  id_estado_solicitud INT NOT NULL,
  fecha DATE DEFAULT (CURRENT_DATE),
  tipo_vivienda VARCHAR(50),
  tiempo_disponible VARCHAR(100),
  experiencia_previa TEXT,
  motivo_adopcion TEXT,
  otras_mascotas TEXT,
  info_economica TEXT,
  notas_admin TEXT,
  respuestas JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_mascota) REFERENCES mascotas(id) ON DELETE CASCADE,
  FOREIGN KEY (id_estado_solicitud) REFERENCES estados_solicitud_adopcion(id_estado_solicitud)
);

-- ============================================================
-- DONACIÓN — con tipo y refugio (diagrama)
-- ============================================================

CREATE TABLE donaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT,
  id_refugio INT,
  id_tipo_donacion INT,
  id_metodo_pago INT,
  nombre_donante VARCHAR(150),
  email_donante VARCHAR(150),
  descripcion TEXT,
  monto DECIMAL(10, 2) NOT NULL,
  cantidad INT COMMENT 'Unidades donadas si aplica (alimento, etc.)',
  estado ENUM('completada', 'pendiente', 'cancelada') DEFAULT 'completada',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE SET NULL,
  FOREIGN KEY (id_tipo_donacion) REFERENCES tipos_donacion(id_tipo_donacion) ON DELETE SET NULL,
  FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago(id_metodo_pago) ON DELETE SET NULL
);

-- ============================================================
-- VOLUNTARIADO — usuario + refugio (diagrama)
-- ============================================================

CREATE TABLE voluntarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_refugio INT NOT NULL,
  fecha DATE DEFAULT (CURRENT_DATE),
  disponibilidad TEXT NOT NULL,
  tarea VARCHAR(255) COMMENT 'Tarea asignada según diagrama',
  experiencia TEXT,
  habilidades TEXT,
  transporte TINYINT(1) DEFAULT 0,
  estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
  notas_admin TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio)
);

-- ============================================================
-- EXTENSIONES DEL SISTEMA (no en ERD, necesarias para la app)
-- ============================================================

CREATE TABLE favoritos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  mascota_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_favorito (usuario_id, mascota_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE
);

CREATE TABLE mensajes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  id_refugio INT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  asunto VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  leido TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE SET NULL
);

CREATE TABLE citas_visita (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_solicitud INT NOT NULL,
  fecha_hora DATETIME NOT NULL,
  estado ENUM('programada', 'realizada', 'cancelada') DEFAULT 'programada',
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_solicitud) REFERENCES solicitudes_adopcion(id) ON DELETE CASCADE
);

CREATE TABLE notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo ENUM('adopcion', 'donacion', 'voluntariado', 'sistema') DEFAULT 'sistema',
  leida TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ============================================================
-- DATOS INICIALES DE CATÁLOGOS
-- ============================================================

INSERT INTO roles (nombre_rol, descripcion) VALUES
  ('admin', 'Administrador del sistema'),
  ('super_admin', 'Administración global de todos los refugios'),
  ('usuario', 'Usuario adoptante / donante');

INSERT INTO tipos_vivienda (tipo, descripcion, tiene_patio) VALUES
  ('Casa', 'Vivienda unifamiliar con posible patio', 1),
  ('Departamento', 'Apartamento en edificio', 0),
  ('Finca', 'Propiedad rural con amplio espacio', 1),
  ('Otro', 'Otro tipo de vivienda', 0);

INSERT INTO tipos_mascota (tipo, codigo) VALUES
  ('Perro', 'perro'),
  ('Gato', 'gato'),
  ('Otro', 'otro');

-- Razas por tipo de mascota
INSERT INTO razas (id_tipo_mascota, nombre, codigo, tamano_tipico) VALUES
  ((SELECT id_tipo_mascota FROM tipos_mascota WHERE codigo = 'perro'), 'Labrador Retriever', 'labrador', 'grande'),
  ((SELECT id_tipo_mascota FROM tipos_mascota WHERE codigo = 'perro'), 'Golden Retriever', 'golden', 'grande'),
  ((SELECT id_tipo_mascota FROM tipos_mascota WHERE codigo = 'perro'), 'Pastor Alemán', 'pastor_aleman', 'grande'),
  ((SELECT id_tipo_mascota FROM tipos_mascota WHERE codigo = 'perro'), 'French Poodle', 'poodle', 'pequeño'),
  ((SELECT id_tipo_mascota FROM tipos_mascota WHERE codigo = 'perro'), 'Beagle', 'beagle', 'mediano'),
  ((SELECT id_tipo_mascota FROM tipos_mascota WHERE codigo = 'perro'), 'Mestizo', 'mestizo_perro', 'mediano'),
  ((SELECT id_tipo_mascota FROM tipos_mascota WHERE codigo = 'gato'), 'Persa', 'persa', 'mediano'),
  ((SELECT id_tipo_mascota FROM tipos_mascota WHERE codigo = 'gato'), 'Siamés', 'siames', 'mediano'),
  ((SELECT id_tipo_mascota FROM tipos_mascota WHERE codigo = 'gato'), 'Maine Coon', 'maine_coon', 'grande'),
  ((SELECT id_tipo_mascota FROM tipos_mascota WHERE codigo = 'gato'), 'Atigrado', 'atigrado', 'mediano'),
  ((SELECT id_tipo_mascota FROM tipos_mascota WHERE codigo = 'gato'), 'Mestizo', 'mestizo_gato', 'mediano'),
  ((SELECT id_tipo_mascota FROM tipos_mascota WHERE codigo = 'otro'), 'Conejo', 'conejo', 'pequeño'),
  ((SELECT id_tipo_mascota FROM tipos_mascota WHERE codigo = 'otro'), 'Otra raza', 'otra', 'mediano');

INSERT INTO estados_mascota (tipo, codigo) VALUES
  ('Disponible', 'disponible'),
  ('En proceso de adopción', 'en_proceso'),
  ('Adoptado', 'adoptado'),
  ('Reservado', 'reservado'),
  ('En tratamiento médico', 'en_tratamiento');

INSERT INTO estados_solicitud_adopcion (tipo, codigo) VALUES
  ('Pendiente', 'pendiente'),
  ('Aprobada', 'aprobada'),
  ('Rechazada', 'rechazada'),
  ('En revisión', 'en_revision');

INSERT INTO tipos_donacion (tipo_de_donacion, descripcion, cantidad_sugerida, monto_sugerido, codigo) VALUES
  ('Donación única', 'Aporte económico puntual', NULL, 50000.00, 'unica'),
  ('Donación mensual', 'Aporte recurrente mensual', NULL, 25000.00, 'mensual'),
  ('Alimento', 'Bolsas de alimento para mascotas', 10, 150000.00, 'alimento'),
  ('Medicina', 'Medicamentos y atención veterinaria', NULL, 200000.00, 'medicina'),
  ('Infraestructura', 'Mejoras en instalaciones del refugio', NULL, 500000.00, 'infraestructura');

INSERT INTO metodos_pago (nombre, codigo) VALUES
  ('MercadoPago', 'mercadopago'),
  ('Tarjeta de crédito/débito', 'tarjeta'),
  ('Transferencia bancaria', 'transferencia');

INSERT INTO refugios (nombre, slug, direccion, descripcion, telefono, email, ciudad, latitud, longitud) VALUES
  ('Refugio Conectado Villa del Rosario', 'villa-del-rosario', 'Villa del Rosario, Córdoba, Argentina', 'Adopción responsable en Villa del Rosario.', '3573404040', 'villa.ejemplo@example.com', 'Villa del Rosario', -31.5622, -63.5386),
  ('Refugio Conectado Pilar', 'pilar', 'Pilar, Córdoba, Argentina', 'Adopción responsable en Pilar.', '3573404041', 'pilar.ejemplo@example.com', 'Pilar', -31.6786, -63.8792),
  ('Refugio Conectado Luque', 'luque', 'Luque, Córdoba, Argentina', 'Adopción responsable en Luque.', '3573404042', 'luque.ejemplo@example.com', 'Luque', -31.6469, -63.3436);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_mascotas_estado ON mascotas(id_estado_mascota);
CREATE INDEX idx_mascotas_tipo ON mascotas(id_tipo_mascota);
CREATE INDEX idx_mascotas_raza ON mascotas(id_raza);
CREATE INDEX idx_mascotas_refugio ON mascotas(id_refugio);
CREATE INDEX idx_razas_tipo ON razas(id_tipo_mascota);
CREATE INDEX idx_historial_mascota ON historial_medico_mascota(id_mascota);
CREATE INDEX idx_historial_fecha ON historial_medico_mascota(fecha);
CREATE INDEX idx_solicitudes_estado ON solicitudes_adopcion(id_estado_solicitud);
CREATE INDEX idx_usuarios_rol ON usuarios(id_rol);
CREATE INDEX idx_usuarios_google ON usuarios(google_id);
CREATE INDEX idx_actividad_fecha ON registros_actividad(created_at);
CREATE INDEX idx_actividad_refugio ON registros_actividad(id_refugio);
CREATE INDEX idx_donaciones_refugio ON donaciones(id_refugio);
CREATE INDEX idx_voluntarios_refugio ON voluntarios(id_refugio);
