import pool from '../config/database.js';

export const FRECUENCIA_DIAS = { semanal: 7, quincenal: 15, mensual: 30 };

export const SEGUIMIENTO_SELECT = `
  SELECT sg.*,
    m.nombre AS mascota_nombre, m.imagen AS mascota_imagen, tm.codigo AS mascota_tipo,
    u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.email AS usuario_email,
    r.nombre AS refugio_nombre
  FROM seguimientos_adopcion sg
  JOIN mascotas m ON sg.id_mascota = m.id
  JOIN tipos_mascota tm ON m.id_tipo_mascota = tm.id_tipo_mascota
  JOIN usuarios u ON sg.id_usuario = u.id
  JOIN refugios r ON sg.id_refugio = r.id_refugio
`;

export function calcProximoReporte(frecuencia, fromDate = new Date()) {
  const dias = FRECUENCIA_DIAS[frecuencia] || 7;
  const d = new Date(fromDate);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export async function crearNotificacion(idUsuario, titulo, mensaje, tipo = 'seguimiento') {
  await pool.query(
    'INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo) VALUES (?,?,?,?)',
    [idUsuario, titulo, mensaje, tipo]
  );
}

export async function notificarAdminsRefugio(idRefugio, titulo, mensaje) {
  const [admins] = await pool.query(
    `SELECT DISTINCT u.id FROM usuarios u
     JOIN roles ro ON u.id_rol = ro.id_rol
     LEFT JOIN usuarios_refugios ur ON ur.id_usuario=u.id
     WHERE ro.nombre_rol = 'admin' AND u.activo=1
       AND (u.id_refugio = ? OR ur.id_refugio = ?)`,
    [idRefugio, idRefugio]
  );
  for (const admin of admins) {
    await crearNotificacion(admin.id, titulo, mensaje, 'seguimiento');
  }
}

export async function crearSeguimientoDesdeSolicitud(solicitudId, { notificar = true } = {}) {
  const [rows] = await pool.query(
    `SELECT s.id, s.id_usuario, s.id_mascota, m.id_refugio, m.nombre AS mascota_nombre
     FROM solicitudes_adopcion s
     JOIN mascotas m ON s.id_mascota = m.id
     WHERE s.id = ?`,
    [solicitudId]
  );
  if (!rows.length) return null;

  const sol = rows[0];
  const [existing] = await pool.query(
    'SELECT id FROM seguimientos_adopcion WHERE id_solicitud = ?',
    [solicitudId]
  );
  if (existing.length) return existing[0].id;

  const hoy = new Date().toISOString().slice(0, 10);
  const proximo = calcProximoReporte('semanal', new Date());

  const [result] = await pool.query(
    `INSERT INTO seguimientos_adopcion
      (id_solicitud, id_usuario, id_mascota, id_refugio, frecuencia_reporte, fecha_inicio, proximo_reporte)
     VALUES (?,?,?,?, 'semanal', ?, ?)`,
    [sol.id, sol.id_usuario, sol.id_mascota, sol.id_refugio, hoy, proximo]
  );

  if (notificar) {
    await crearNotificacion(
      sol.id_usuario,
      '¡Adopción aprobada!',
      `Tu adopción de ${sol.mascota_nombre} fue aprobada. Activá el seguimiento post-adopción y subí fotos periódicas.`,
      'adopcion'
    );
  }

  return result.insertId;
}

export async function getReportesConImagenes(idSeguimiento) {
  const [reportes] = await pool.query(
    `SELECT * FROM reportes_seguimiento WHERE id_seguimiento = ? ORDER BY created_at DESC`,
    [idSeguimiento]
  );

  if (!reportes.length) return [];

  const ids = reportes.map((r) => r.id);
  const [imagenes] = await pool.query(
    `SELECT * FROM reportes_seguimiento_imagenes
     WHERE id_reporte IN (${ids.map(() => '?').join(',')})
     ORDER BY orden ASC`,
    ids
  );

  const byReporte = {};
  for (const img of imagenes) {
    if (!byReporte[img.id_reporte]) byReporte[img.id_reporte] = [];
    byReporte[img.id_reporte].push(img);
  }

  return reportes.map((r) => ({
    ...r,
    imagenes: byReporte[r.id] || [],
  }));
}

/** Normaliza DATE de MySQL (Date | string) a YYYY-MM-DD en zona local */
export function toDateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
}

export function estadoReporteSeguimiento(seguimiento) {
  if (seguimiento.estado !== 'activo') return 'inactivo';
  const hoy = toDateOnly(new Date());
  const proximo = toDateOnly(seguimiento.proximo_reporte);
  if (proximo && proximo <= hoy) return 'pendiente';
  return 'al_dia';
}
