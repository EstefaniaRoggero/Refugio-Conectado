-- Migración incremental: razas + historial_medico_mascota
-- Ejecutar solo si ya tienes la BD anterior SIN estas tablas:
--   mysql -u root -p refugio_conectado < database/migration_razas_historial.sql

USE refugio_conectado;

CREATE TABLE IF NOT EXISTS razas (
  id_raza INT AUTO_INCREMENT PRIMARY KEY,
  id_tipo_mascota INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(50),
  descripcion VARCHAR(255),
  tamano_tipico ENUM('pequeño', 'mediano', 'grande'),
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_tipo_mascota) REFERENCES tipos_mascota(id_tipo_mascota) ON DELETE CASCADE,
  UNIQUE KEY uk_raza_tipo (id_tipo_mascota, nombre)
);

-- Agregar FK de raza en mascotas si no existe
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'refugio_conectado' AND TABLE_NAME = 'mascotas' AND COLUMN_NAME = 'id_raza');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE mascotas ADD COLUMN id_raza INT NULL AFTER id_tipo_mascota, ADD FOREIGN KEY (id_raza) REFERENCES razas(id_raza) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS historial_medico_mascota (
  id_historial INT AUTO_INCREMENT PRIMARY KEY,
  id_mascota INT NOT NULL,
  tipo ENUM('vacuna', 'cirugia', 'consulta', 'desparasitacion', 'esterilizacion', 'tratamiento', 'otro') NOT NULL,
  procedimiento VARCHAR(150) NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  veterinario VARCHAR(150),
  proxima_dosis DATE,
  lote VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_mascota) REFERENCES mascotas(id) ON DELETE CASCADE
);

-- Catálogo de razas (ignora duplicados)
INSERT IGNORE INTO razas (id_tipo_mascota, nombre, codigo, tamano_tipico)
SELECT id_tipo_mascota, 'Labrador Retriever', 'labrador', 'grande' FROM tipos_mascota WHERE codigo = 'perro';
INSERT IGNORE INTO razas (id_tipo_mascota, nombre, codigo, tamano_tipico)
SELECT id_tipo_mascota, 'Golden Retriever', 'golden', 'grande' FROM tipos_mascota WHERE codigo = 'perro';
INSERT IGNORE INTO razas (id_tipo_mascota, nombre, codigo, tamano_tipico)
SELECT id_tipo_mascota, 'Pastor Alemán', 'pastor_aleman', 'grande' FROM tipos_mascota WHERE codigo = 'perro';
INSERT IGNORE INTO razas (id_tipo_mascota, nombre, codigo, tamano_tipico)
SELECT id_tipo_mascota, 'Mestizo', 'mestizo_perro', 'mediano' FROM tipos_mascota WHERE codigo = 'perro';
INSERT IGNORE INTO razas (id_tipo_mascota, nombre, codigo, tamano_tipico)
SELECT id_tipo_mascota, 'Persa', 'persa', 'mediano' FROM tipos_mascota WHERE codigo = 'gato';
INSERT IGNORE INTO razas (id_tipo_mascota, nombre, codigo, tamano_tipico)
SELECT id_tipo_mascota, 'Atigrado', 'atigrado', 'mediano' FROM tipos_mascota WHERE codigo = 'gato';
INSERT IGNORE INTO razas (id_tipo_mascota, nombre, codigo, tamano_tipico)
SELECT id_tipo_mascota, 'Mestizo', 'mestizo_gato', 'mediano' FROM tipos_mascota WHERE codigo = 'gato';

CREATE INDEX IF NOT EXISTS idx_mascotas_raza ON mascotas(id_raza);
CREATE INDEX IF NOT EXISTS idx_razas_tipo ON razas(id_tipo_mascota);
CREATE INDEX IF NOT EXISTS idx_historial_mascota ON historial_medico_mascota(id_mascota);
