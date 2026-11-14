import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';
import { getCatalogId } from '../utils/lookups.js';
import { crearSeguimientoDesdeSolicitud } from '../services/seguimientoService.js';

const SOLICITUD_SELECT = `
  SELECT s.*, esa.codigo AS estado, esa.tipo AS estado_nombre,
    m.nombre AS mascota_nombre, m.imagen AS mascota_imagen,
    tm.codigo AS mascota_tipo
  FROM solicitudes_adopcion s
  JOIN estados_solicitud_adopcion esa ON s.id_estado_solicitud = esa.id_estado_solicitud
  JOIN mascotas m ON s.id_mascota = m.id
  JOIN tipos_mascota tm ON m.id_tipo_mascota = tm.id_tipo_mascota
`;

export const crearSolicitud = asyncHandler(async (req, res) => {
  const { mascota_id, tipo_vivienda, tiempo_disponible, experiencia_previa, motivo_adopcion, otras_mascotas, info_economica, respuestas } = req.body;

  const [mascotas] = await pool.query(
    `SELECT m.id FROM mascotas m
     JOIN estados_mascota em ON m.id_estado_mascota = em.id_estado_mascota
     WHERE m.id = ? AND em.codigo = 'disponible'${req.refugioId ? ' AND m.id_refugio = ?' : ''}`,
    req.refugioId ? [mascota_id, req.refugioId] : [mascota_id]
  );
  if (!mascotas.length) return error(res, 'La mascota no está disponible para adopción', 400);

  const idPendiente = await getCatalogId('estado_solicitud', 'codigo', 'pendiente');

  const [pendientes] = await pool.query(
    `SELECT s.id FROM solicitudes_adopcion s
     JOIN estados_solicitud_adopcion esa ON s.id_estado_solicitud = esa.id_estado_solicitud
     WHERE s.id_usuario = ? AND s.id_mascota = ? AND esa.codigo = 'pendiente'`,
    [req.user.id, mascota_id]
  );
  if (pendientes.length) return error(res, 'Ya tienes una solicitud pendiente para esta mascota', 409);

  const [result] = await pool.query(
    `INSERT INTO solicitudes_adopcion (id_usuario, id_mascota, id_estado_solicitud, tipo_vivienda, tiempo_disponible,
      experiencia_previa, motivo_adopcion, otras_mascotas, info_economica, respuestas)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      req.user.id, mascota_id, idPendiente, tipo_vivienda, tiempo_disponible, experiencia_previa,
      motivo_adopcion, otras_mascotas, info_economica,
      respuestas ? JSON.stringify(respuestas) : null,
    ]
  );

  const idEnProceso = await getCatalogId('estado_mascota', 'codigo', 'en_proceso');
  await pool.query('UPDATE mascotas SET id_estado_mascota = ? WHERE id = ?', [idEnProceso, mascota_id]);

  const [solicitudes] = await pool.query(`${SOLICITUD_SELECT} WHERE s.id = ?`, [result.insertId]);
  success(res, { solicitud: solicitudes[0] }, 'Solicitud de adopción enviada', 201);
});

export const getMisSolicitudes = asyncHandler(async (req, res) => {
  const params = [req.user.id];
  let sql = `${SOLICITUD_SELECT} WHERE s.id_usuario = ?`;
  if (req.refugioId) {
    sql += ' AND m.id_refugio = ?';
    params.push(req.refugioId);
  }
  sql += ' ORDER BY s.created_at DESC';
  const [solicitudes] = await pool.query(sql, params);
  success(res, { solicitudes });
});

export const getAllSolicitudes = asyncHandler(async (req, res) => {
  const estado = req.query.estado;
  let sql = `${SOLICITUD_SELECT.replace('SELECT s.*', 'SELECT s.*, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.email AS usuario_email, u.telefono')}
    JOIN usuarios u ON s.id_usuario = u.id`;
  const params = [];
  const conditions = [];
  if (req.refugioId) {
    conditions.push('m.id_refugio = ?');
    params.push(req.refugioId);
  }
  if (estado) {
    conditions.push('esa.codigo = ?');
    params.push(estado);
  }
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ' ORDER BY s.created_at DESC';

  const [solicitudes] = await pool.query(sql, params);
  success(res, { solicitudes });
});

export const actualizarEstado = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { estado, notas_admin } = req.body;

  if (!['aprobada', 'rechazada', 'pendiente', 'en_revision'].includes(estado)) {
    return error(res, 'Estado inválido', 400);
  }

  const [solicitudes] = await pool.query(
    `SELECT s.* FROM solicitudes_adopcion s
     JOIN mascotas m ON m.id=s.id_mascota
     WHERE s.id=? AND m.id_refugio=?`,
    [id, req.refugioId]
  );
  if (!solicitudes.length) return error(res, 'Solicitud no encontrada', 404);
  req.auditBefore = solicitudes[0];

  const idEstado = await getCatalogId('estado_solicitud', 'codigo', estado);
  await pool.query('UPDATE solicitudes_adopcion SET id_estado_solicitud = ?, notas_admin = ? WHERE id = ?', [idEstado, notas_admin || null, id]);

  const codigoMascota = estado === 'aprobada' ? 'adoptado' : estado === 'rechazada' ? 'disponible' : 'en_proceso';
  const idEstadoMascota = await getCatalogId('estado_mascota', 'codigo', codigoMascota);
  await pool.query('UPDATE mascotas SET id_estado_mascota = ? WHERE id = ?', [idEstadoMascota, solicitudes[0].id_mascota]);

  if (estado === 'aprobada') {
    try {
      await crearSeguimientoDesdeSolicitud(id);
    } catch (err) {
      console.warn('Seguimiento post-adopción:', err.message);
    }
  }

  const [updated] = await pool.query(`${SOLICITUD_SELECT} WHERE s.id = ? AND m.id_refugio=?`, [id, req.refugioId]);
  req.auditAfter = updated[0] || null;
  success(res, { solicitud: updated[0] }, `Solicitud ${estado}`);
});
