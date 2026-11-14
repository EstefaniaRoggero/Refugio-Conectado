-- Migración Fase 1: seguimiento post-adopción
-- Ejecutar: mysql -u root -p refugio_conectado < database/migration_seguimiento_post_adopcion.sql

USE refugio_conectado;

CREATE TABLE IF NOT EXISTS seguimientos_adopcion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_solicitud INT NOT NULL,
  id_usuario INT NOT NULL,
  id_mascota INT NOT NULL,
  id_refugio INT NOT NULL,
  frecuencia_reporte ENUM('semanal', 'quincenal', 'mensual') NOT NULL DEFAULT 'semanal',
  fecha_inicio DATE NOT NULL,
  proximo_reporte DATE NOT NULL,
  estado ENUM('activo', 'pausado', 'cerrado') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_seguimiento_solicitud (id_solicitud),
  FOREIGN KEY (id_solicitud) REFERENCES solicitudes_adopcion(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_mascota) REFERENCES mascotas(id) ON DELETE CASCADE,
  FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE CASCADE,
  INDEX idx_seguimiento_usuario (id_usuario),
  INDEX idx_seguimiento_refugio (id_refugio),
  INDEX idx_seguimiento_proximo (proximo_reporte)
);

CREATE TABLE IF NOT EXISTS reportes_seguimiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_seguimiento INT NOT NULL,
  comentario TEXT,
  estado ENUM('enviado', 'revisado') NOT NULL DEFAULT 'enviado',
  notas_admin TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_seguimiento) REFERENCES seguimientos_adopcion(id) ON DELETE CASCADE,
  INDEX idx_reporte_seguimiento (id_seguimiento)
);

CREATE TABLE IF NOT EXISTS reportes_seguimiento_imagenes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_reporte INT NOT NULL,
  url VARCHAR(255) NOT NULL,
  orden INT DEFAULT 0,
  FOREIGN KEY (id_reporte) REFERENCES reportes_seguimiento(id) ON DELETE CASCADE
);

ALTER TABLE notificaciones
  MODIFY COLUMN tipo ENUM('adopcion', 'donacion', 'voluntariado', 'sistema', 'seguimiento') DEFAULT 'sistema';
