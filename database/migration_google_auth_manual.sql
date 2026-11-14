-- Usar este archivo si migration_google_auth.sql falla (MySQL sin IF NOT EXISTS en columnas)
USE refugio_conectado;

ALTER TABLE usuarios MODIFY COLUMN password VARCHAR(255) NULL;
ALTER TABLE usuarios ADD COLUMN google_id VARCHAR(255) UNIQUE NULL AFTER password;
ALTER TABLE usuarios ADD COLUMN auth_provider ENUM('local', 'google') NOT NULL DEFAULT 'local' AFTER google_id;
