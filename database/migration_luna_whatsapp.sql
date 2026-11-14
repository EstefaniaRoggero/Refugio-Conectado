-- Luna WhatsApp: sesiones de conversación por teléfono
USE refugio_conectado;

CREATE TABLE IF NOT EXISTS luna_whatsapp_sesiones (
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
);
