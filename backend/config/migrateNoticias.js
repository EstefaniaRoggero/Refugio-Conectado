import pool from './database.js';

async function tableExists(table) {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows.length > 0;
}

export async function migrateNoticias() {
  if (!(await tableExists('noticias'))) {
    await pool.query(`
      CREATE TABLE noticias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_refugio INT NOT NULL,
        id_usuario INT NULL,
        tipo ENUM('vacunacion', 'castracion', 'campana', 'evento', 'novedad') NOT NULL DEFAULT 'novedad',
        titulo VARCHAR(150) NOT NULL,
        contenido TEXT NOT NULL,
        imagen VARCHAR(255) NULL,
        fecha_evento DATE NULL,
        horario VARCHAR(60) NULL,
        lugar VARCHAR(150) NULL,
        vigente_hasta DATE NULL,
        destacada TINYINT(1) NOT NULL DEFAULT 0,
        publicada TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL,
        INDEX idx_noticias_refugio (id_refugio, publicada)
      )
    `);
  }

  console.log('✓ Migración novedades aplicada');
}
