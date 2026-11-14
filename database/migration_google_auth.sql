-- Migración: login Google para usuarios + admin solo local
USE refugio_conectado;

ALTER TABLE usuarios
  MODIFY COLUMN password VARCHAR(255) NULL COMMENT 'NULL si ingresa con Google';

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE NULL AFTER password,
  ADD COLUMN IF NOT EXISTS auth_provider ENUM('local', 'google') DEFAULT 'local' AFTER google_id;

-- MySQL 8.0.12+ no tiene IF NOT EXISTS en ADD COLUMN; si falla, ejecutar solo las líneas que falten:
-- ALTER TABLE usuarios ADD COLUMN google_id VARCHAR(255) UNIQUE NULL AFTER password;
-- ALTER TABLE usuarios ADD COLUMN auth_provider ENUM('local', 'google') DEFAULT 'local' AFTER google_id;

CREATE INDEX idx_usuarios_google ON usuarios(google_id);
