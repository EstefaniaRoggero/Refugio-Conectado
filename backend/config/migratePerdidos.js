import pool from './database.js';

async function tableExists(table) {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows.length > 0;
}

export async function migratePerdidos() {
  if (!(await tableExists('avisos_perdidos'))) {
    await pool.query(`
      CREATE TABLE avisos_perdidos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_refugio INT NOT NULL,
        id_usuario INT NULL,
        tipo ENUM('perdido', 'encontrado') NOT NULL,
        especie ENUM('perro', 'gato', 'otro') NOT NULL,
        nombre_mascota VARCHAR(80) NULL,
        descripcion TEXT NOT NULL,
        zona VARCHAR(150) NOT NULL,
        fecha_evento DATE NOT NULL,
        resguardado TINYINT(1) NULL,
        contacto_nombre VARCHAR(100) NOT NULL,
        contacto_telefono VARCHAR(30) NOT NULL,
        estado ENUM('pendiente', 'publicado', 'rechazado', 'resuelto') NOT NULL DEFAULT 'pendiente',
        motivo_rechazo VARCHAR(255) NULL,
        publicado_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL,
        INDEX idx_avisos_refugio_estado (id_refugio, estado)
      )
    `);
  }

  if (!(await tableExists('avisos_perdidos_imagenes'))) {
    await pool.query(`
      CREATE TABLE avisos_perdidos_imagenes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_aviso INT NOT NULL,
        url VARCHAR(255) NOT NULL,
        orden INT DEFAULT 0,
        FOREIGN KEY (id_aviso) REFERENCES avisos_perdidos(id) ON DELETE CASCADE
      )
    `);
  }

  console.log('✓ Migración perdidos y encontrados aplicada');
}
