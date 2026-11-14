-- SaaS multi-refugio: migración inicial no destructiva.
-- Los refugios nuevos se administran desde el backoffice y nunca se eliminan aquí.
ALTER TABLE refugios
  ADD COLUMN slug VARCHAR(80) NULL UNIQUE AFTER nombre;

ALTER TABLE usuarios
  ADD COLUMN id_refugio INT NULL AFTER id_rol,
  ADD CONSTRAINT fk_usuarios_refugio FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE SET NULL;

INSERT IGNORE INTO refugios (nombre, slug, direccion, descripcion, telefono, email, ciudad, activo) VALUES
  ('Refugio Conectado Villa del Rosario', 'villa-del-rosario', 'Villa del Rosario, Córdoba, Argentina', 'Adopción responsable y rescate animal en Villa del Rosario.', '3573404040', 'villa.ejemplo@example.com', 'Villa del Rosario', 1),
  ('Refugio Conectado Pilar', 'pilar', 'Pilar, Córdoba, Argentina', 'Adopción responsable y rescate animal en Pilar.', '3573404041', 'pilar.ejemplo@example.com', 'Pilar', 1),
  ('Refugio Conectado Luque', 'luque', 'Luque, Córdoba, Argentina', 'Adopción responsable y rescate animal en Luque.', '3573404042', 'luque.ejemplo@example.com', 'Luque', 1);

ALTER TABLE refugios
  ADD COLUMN latitud DECIMAL(10, 7) NULL AFTER ciudad,
  ADD COLUMN longitud DECIMAL(10, 7) NULL AFTER latitud;

-- No se reasignan ni se borran datos existentes. Las coordenadas y los datos de
-- cada sede pueden editarse desde el backoffice global.
