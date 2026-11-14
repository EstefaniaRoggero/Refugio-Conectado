import pool from './database.js';

async function tableExists(table) {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows.length > 0;
}

export async function migrateWhatsappLuna() {
  if (await tableExists('luna_whatsapp_sesiones')) return;

  await pool.query(`
    CREATE TABLE luna_whatsapp_sesiones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      wa_id VARCHAR(30) NOT NULL COMMENT 'Teléfono WhatsApp sin +',
      id_usuario INT NULL,
      id_refugio INT NULL,
      mensajes JSON COMMENT 'Historial reciente [{role, content}]',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_wa_id (wa_id),
      FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL,
      FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE SET NULL
    )
  `);
}
