import bcrypt from 'bcryptjs';
import pool from './database.js';

export async function migrateBackoffice() {
  await pool.query(
    `INSERT INTO roles (nombre_rol, descripcion)
     VALUES ('super_admin', 'Administración global de todos los refugios')
     ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion)`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios_refugios (
      id_usuario INT NOT NULL,
      id_refugio INT NOT NULL,
      es_principal TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_usuario, id_refugio),
      CONSTRAINT fk_usuario_refugio_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
      CONSTRAINT fk_usuario_refugio_refugio FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    INSERT IGNORE INTO usuarios_refugios (id_usuario, id_refugio, es_principal)
    SELECT u.id, u.id_refugio, 1
    FROM usuarios u
    JOIN roles r ON r.id_rol = u.id_rol
    WHERE r.nombre_rol = 'admin' AND u.id_refugio IS NOT NULL
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS registros_actividad (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT NULL,
      id_refugio INT NULL,
      rol_actor VARCHAR(50) NULL,
      accion VARCHAR(120) NOT NULL,
      entidad VARCHAR(80) NULL,
      entidad_id VARCHAR(100) NULL,
      resultado ENUM('exito', 'error') DEFAULT 'exito',
      datos JSON NULL,
      ip VARCHAR(64) NULL,
      user_agent VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_actividad_fecha (created_at),
      INDEX idx_actividad_refugio (id_refugio),
      INDEX idx_actividad_usuario (id_usuario),
      CONSTRAINT fk_actividad_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL,
      CONSTRAINT fk_actividad_refugio FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invitaciones_admin (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT NOT NULL,
      token_hash CHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_invitacion_usuario (id_usuario),
      CONSTRAINT fk_invitacion_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (email && password) {
    const [[role]] = await pool.query("SELECT id_rol FROM roles WHERE nombre_rol = 'super_admin' LIMIT 1");
    const [existing] = await pool.query(
      `SELECT u.id, r.nombre_rol AS rol FROM usuarios u
       JOIN roles r ON r.id_rol=u.id_rol WHERE u.email = ? LIMIT 1`,
      [email]
    );
    if (existing.length && existing[0].rol !== 'super_admin') {
      const hashed = await bcrypt.hash(password, 12);
      await pool.query(
        "UPDATE usuarios SET id_rol = ?, password = ?, auth_provider = 'local', activo = 1 WHERE id = ?",
        [role.id_rol, hashed, existing[0].id]
      );
    } else if (!existing.length) {
      const hashed = await bcrypt.hash(password, 12);
      await pool.query(
        `INSERT INTO usuarios (nombre, apellido, email, password, id_rol, auth_provider, activo)
         VALUES (?, ?, ?, ?, ?, 'local', 1)`,
        ['Super', 'Administrador', email, hashed, role.id_rol]
      );
    }
  }

  console.log('✓ Backoffice y registro de actividad verificados');
}

