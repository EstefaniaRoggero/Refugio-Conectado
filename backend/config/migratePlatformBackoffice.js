import pool from './database.js';

const normalizeSlug = (value = '') => value
  .trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

export async function migratePlatformBackoffice() {
  await pool.query(`
    INSERT INTO roles (nombre_rol, descripcion) VALUES
      ('voluntario', 'Voluntario con acceso al panel de usuario')
    ON DUPLICATE KEY UPDATE descripcion=VALUES(descripcion)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS zonas (
      id_zona INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      slug VARCHAR(120) NOT NULL UNIQUE,
      descripcion VARCHAR(500) NULL,
      provincia VARCHAR(100) NULL,
      activo TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (!(await columnExists('refugios', 'id_zona'))) {
    await pool.query('ALTER TABLE refugios ADD COLUMN id_zona INT NULL AFTER ciudad');
    await pool.query('ALTER TABLE refugios ADD INDEX idx_refugios_zona (id_zona)');
    await pool.query('ALTER TABLE refugios ADD CONSTRAINT fk_refugios_zona FOREIGN KEY (id_zona) REFERENCES zonas(id_zona) ON DELETE SET NULL');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS localidades (
      id_localidad INT AUTO_INCREMENT PRIMARY KEY,
      id_zona INT NOT NULL,
      nombre VARCHAR(120) NOT NULL,
      activo TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_localidad_zona (id_zona, nombre),
      CONSTRAINT fk_localidad_zona FOREIGN KEY (id_zona) REFERENCES zonas(id_zona) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [cities] = await pool.query("SELECT DISTINCT TRIM(ciudad) ciudad FROM refugios WHERE ciudad IS NOT NULL AND TRIM(ciudad) <> ''");
  for (const { ciudad } of cities) {
    const slug = normalizeSlug(ciudad);
    await pool.query(
      `INSERT INTO zonas (nombre, slug, provincia) VALUES (?, ?, 'Córdoba')
       ON DUPLICATE KEY UPDATE nombre=VALUES(nombre)`,
      [ciudad, slug]
    );
    await pool.query(
      'UPDATE refugios r JOIN zonas z ON z.slug=? SET r.id_zona=z.id_zona WHERE r.ciudad=? AND r.id_zona IS NULL',
      [slug, ciudad]
    );
    await pool.query(
      `INSERT IGNORE INTO localidades (id_zona, nombre)
       SELECT id_zona, ? FROM zonas WHERE slug=?`,
      [ciudad, slug]
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS solicitudes_refugio (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre_refugio VARCHAR(150) NOT NULL,
      responsable VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL,
      telefono VARCHAR(40) NULL,
      ciudad VARCHAR(100) NOT NULL,
      direccion VARCHAR(255) NULL,
      descripcion TEXT NULL,
      estado ENUM('pendiente','aprobada','rechazada') DEFAULT 'pendiente',
      notas_revision TEXT NULL,
      revisado_por INT NULL,
      reviewed_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_solicitudes_refugio_estado (estado),
      CONSTRAINT fk_solicitud_refugio_revisor FOREIGN KEY (revisado_por) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (!(await columnExists('solicitudes_refugio', 'documentacion_url'))) {
    await pool.query('ALTER TABLE solicitudes_refugio ADD COLUMN documentacion_url VARCHAR(500) NULL AFTER descripcion');
  }
  if (!(await columnExists('solicitudes_refugio', 'id_refugio_aprobado'))) {
    await pool.query('ALTER TABLE solicitudes_refugio ADD COLUMN id_refugio_aprobado INT NULL AFTER revisado_por');
    await pool.query('ALTER TABLE solicitudes_refugio ADD CONSTRAINT fk_solicitud_refugio_creado FOREIGN KEY (id_refugio_aprobado) REFERENCES refugios(id_refugio) ON DELETE SET NULL');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS organizaciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tipo ENUM('municipalidad','veterinaria','otra') NOT NULL,
      nombre VARCHAR(180) NOT NULL,
      cuit VARCHAR(30) NULL,
      email VARCHAR(150) NULL,
      telefono VARCHAR(40) NULL,
      direccion VARCHAR(255) NULL,
      ciudad VARCHAR(100) NULL,
      id_zona INT NULL,
      contacto VARCHAR(150) NULL,
      notas TEXT NULL,
      activo TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_organizaciones_tipo (tipo),
      CONSTRAINT fk_organizacion_zona FOREIGN KEY (id_zona) REFERENCES zonas(id_zona) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query("ALTER TABLE organizaciones MODIFY COLUMN tipo ENUM('municipalidad','veterinaria','organizacion','empresa','otra') NOT NULL");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS convenios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      titulo VARCHAR(180) NOT NULL,
      id_organizacion INT NOT NULL,
      id_refugio INT NULL,
      id_zona INT NULL,
      descripcion TEXT NULL,
      fecha_inicio DATE NULL,
      fecha_fin DATE NULL,
      estado ENUM('borrador','activo','pausado','finalizado') DEFAULT 'borrador',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_convenios_estado (estado),
      CONSTRAINT fk_convenio_organizacion FOREIGN KEY (id_organizacion) REFERENCES organizaciones(id) ON DELETE CASCADE,
      CONSTRAINT fk_convenio_refugio FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE SET NULL,
      CONSTRAINT fk_convenio_zona FOREIGN KEY (id_zona) REFERENCES zonas(id_zona) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (!(await columnExists('convenios', 'tipo_convenio'))) {
    await pool.query("ALTER TABLE convenios ADD COLUMN tipo_convenio VARCHAR(80) NOT NULL DEFAULT 'colaboracion' AFTER titulo");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS catalogos_sistema (
      id INT AUTO_INCREMENT PRIMARY KEY,
      grupo VARCHAR(80) NOT NULL,
      codigo VARCHAR(80) NOT NULL,
      nombre VARCHAR(120) NOT NULL,
      descripcion VARCHAR(255) NULL,
      orden INT DEFAULT 0,
      activo TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_catalogo_grupo_codigo (grupo, codigo),
      INDEX idx_catalogo_grupo_activo (grupo, activo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    INSERT IGNORE INTO catalogos_sistema (grupo,codigo,nombre,orden) VALUES
      ('tamanos','pequeño','Pequeño',10),('tamanos','mediano','Mediano',20),('tamanos','grande','Grande',30),
      ('niveles_energia','baja','Baja',10),('niveles_energia','media','Media',20),('niveles_energia','alta','Alta',30),
      ('tipos_organizacion','municipalidad','Municipalidad',10),('tipos_organizacion','veterinaria','Veterinaria',20),
      ('tipos_organizacion','organizacion','Organización',30),('tipos_organizacion','empresa','Empresa',40),('tipos_organizacion','otra','Otra',50),
      ('tipos_convenio','colaboracion','Colaboración',10),('tipos_convenio','atencion_veterinaria','Atención veterinaria',20),
      ('tipos_convenio','financiamiento','Financiamiento',30),('tipos_convenio','capacitacion','Capacitación',40),('tipos_convenio','otro','Otro',50)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS configuraciones_sistema (
      clave VARCHAR(100) PRIMARY KEY,
      valor TEXT NULL,
      grupo VARCHAR(80) DEFAULT 'general',
      descripcion VARCHAR(255) NULL,
      updated_by INT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_config_usuario FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    INSERT IGNORE INTO configuraciones_sistema (clave, valor, grupo, descripcion) VALUES
      ('nombre_plataforma', 'Refugio Conectado', 'general', 'Nombre visible de la plataforma'),
      ('email_soporte', '', 'general', 'Correo general de soporte'),
      ('modo_mantenimiento', 'false', 'operacion', 'Activa el aviso global de mantenimiento'),
      ('solicitudes_refugio_habilitadas', 'true', 'operacion', 'Permite recibir nuevas solicitudes de refugios'),
      ('dias_vigencia_invitacion', '2', 'seguridad', 'Días de vigencia de las invitaciones administrativas')
  `);

  console.log('✓ Módulos globales del backoffice verificados');
}
