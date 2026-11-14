import pool from './database.js';
import { crearSeguimientoDesdeSolicitud } from '../services/seguimientoService.js';

async function tableExists(table) {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows.length > 0;
}

export async function migrateSeguimiento() {
  if (!(await tableExists('seguimientos_adopcion'))) {
    await pool.query(`
      CREATE TABLE seguimientos_adopcion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_solicitud INT NOT NULL,
        id_usuario INT NOT NULL,
        id_mascota INT NOT NULL,
        id_refugio INT NOT NULL,
        frecuencia_reporte ENUM('semanal', 'quincenal', 'mensual') NOT NULL DEFAULT 'semanal',
        fecha_inicio DATE NOT NULL,
        proximo_reporte DATE NOT NULL,
        estado ENUM('activo', 'pausado', 'cerrado') NOT NULL DEFAULT 'activo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_seguimiento_solicitud (id_solicitud),
        FOREIGN KEY (id_solicitud) REFERENCES solicitudes_adopcion(id) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (id_mascota) REFERENCES mascotas(id) ON DELETE CASCADE,
        FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE CASCADE,
        INDEX idx_seguimiento_usuario (id_usuario),
        INDEX idx_seguimiento_refugio (id_refugio),
        INDEX idx_seguimiento_proximo (proximo_reporte)
      )
    `);
  }

  if (!(await tableExists('reportes_seguimiento'))) {
    await pool.query(`
      CREATE TABLE reportes_seguimiento (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_seguimiento INT NOT NULL,
        comentario TEXT,
        estado ENUM('enviado', 'revisado') NOT NULL DEFAULT 'enviado',
        notas_admin TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_seguimiento) REFERENCES seguimientos_adopcion(id) ON DELETE CASCADE,
        INDEX idx_reporte_seguimiento (id_seguimiento)
      )
    `);
  }

  if (!(await tableExists('reportes_seguimiento_imagenes'))) {
    await pool.query(`
      CREATE TABLE reportes_seguimiento_imagenes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_reporte INT NOT NULL,
        url VARCHAR(255) NOT NULL,
        orden INT DEFAULT 0,
        FOREIGN KEY (id_reporte) REFERENCES reportes_seguimiento(id) ON DELETE CASCADE
      )
    `);
  }

  try {
    await pool.query(`
      ALTER TABLE notificaciones
        MODIFY COLUMN tipo ENUM('adopcion', 'donacion', 'voluntariado', 'sistema', 'seguimiento') DEFAULT 'sistema'
    `);
  } catch {
    /* columna ya actualizada */
  }

  const [pendientes] = await pool.query(
    `SELECT s.id FROM solicitudes_adopcion s
     JOIN estados_solicitud_adopcion esa ON s.id_estado_solicitud = esa.id_estado_solicitud
     LEFT JOIN seguimientos_adopcion sg ON sg.id_solicitud = s.id
     WHERE esa.codigo = 'aprobada' AND sg.id IS NULL`
  );

  for (const row of pendientes) {
    try {
      await crearSeguimientoDesdeSolicitud(row.id, { notificar: false });
    } catch (err) {
      console.warn(`Seguimiento backfill solicitud ${row.id}:`, err.message);
    }
  }

  console.log('✓ Migración seguimiento post-adopción aplicada');
}
