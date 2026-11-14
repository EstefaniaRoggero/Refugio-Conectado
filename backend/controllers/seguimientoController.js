import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';
import { saveUpload } from '../middlewares/upload.js';
import {
  SEGUIMIENTO_SELECT,
  FRECUENCIA_DIAS,
  calcProximoReporte,
  crearNotificacion,
  notificarAdminsRefugio,
  getReportesConImagenes,
  estadoReporteSeguimiento,
} from '../services/seguimientoService.js';

const assertSeguimientoUsuario = async (id, userId, refugioId) => {
  const params = [id, userId];
  let sql = `${SEGUIMIENTO_SELECT} WHERE sg.id = ? AND sg.id_usuario = ?`;
  if (refugioId) {
    sql += ' AND sg.id_refugio = ?';
    params.push(refugioId);
  }
  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
};

const assertSeguimientoAdmin = async (id, refugioId) => {
  const params = [id];
  let sql = `${SEGUIMIENTO_SELECT} WHERE sg.id = ?`;
  if (refugioId) {
    sql += ' AND sg.id_refugio = ?';
    params.push(refugioId);
  }
  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
};

export const getMisSeguimientos = asyncHandler(async (req, res) => {
  const params = [req.user.id];
  let sql = `${SEGUIMIENTO_SELECT} WHERE sg.id_usuario = ? AND sg.estado = 'activo'`;
  if (req.refugioId) {
    sql += ' AND sg.id_refugio = ?';
    params.push(req.refugioId);
  }
  sql += ' ORDER BY sg.proximo_reporte ASC';

  const [seguimientos] = await pool.query(sql, params);
  success(res, {
    seguimientos: seguimientos.map((s) => ({
      ...s,
      estado_reporte: estadoReporteSeguimiento(s),
    })),
  });
});

export const getSeguimientoDetalle = asyncHandler(async (req, res) => {
  const seguimiento = await assertSeguimientoUsuario(req.params.id, req.user.id, req.refugioId);
  if (!seguimiento) return error(res, 'Seguimiento no encontrado', 404);

  const reportes = await getReportesConImagenes(seguimiento.id);
  success(res, {
    seguimiento: { ...seguimiento, estado_reporte: estadoReporteSeguimiento(seguimiento) },
    reportes,
  });
});

export const actualizarFrecuencia = asyncHandler(async (req, res) => {
  const { frecuencia_reporte } = req.body;
  if (!FRECUENCIA_DIAS[frecuencia_reporte]) {
    return error(res, 'Frecuencia inválida. Use: semanal, quincenal o mensual', 400);
  }

  const seguimiento = await assertSeguimientoUsuario(req.params.id, req.user.id, req.refugioId);
  if (!seguimiento) return error(res, 'Seguimiento no encontrado', 404);

  const proximo = calcProximoReporte(frecuencia_reporte, new Date());
  await pool.query(
    'UPDATE seguimientos_adopcion SET frecuencia_reporte = ?, proximo_reporte = ? WHERE id = ?',
    [frecuencia_reporte, proximo, seguimiento.id]
  );

  const [updated] = await pool.query(`${SEGUIMIENTO_SELECT} WHERE sg.id = ?`, [seguimiento.id]);
  success(res, { seguimiento: updated[0] }, 'Frecuencia actualizada');
});

export const crearReporte = asyncHandler(async (req, res) => {
  const seguimiento = await assertSeguimientoUsuario(req.params.id, req.user.id, req.refugioId);
  if (!seguimiento) return error(res, 'Seguimiento no encontrado', 404);
  if (seguimiento.estado !== 'activo') return error(res, 'Este seguimiento no está activo', 400);

  const files = req.files || [];
  const comentario = req.body.comentario?.trim() || null;

  if (!files.length && !comentario) {
    return error(res, 'Agregá un comentario o al menos una foto para enviar el reporte', 400);
  }

  const [result] = await pool.query(
    'INSERT INTO reportes_seguimiento (id_seguimiento, comentario) VALUES (?,?)',
    [seguimiento.id, comentario]
  );

  const idReporte = result.insertId;
  const urls = [];
  for (let i = 0; i < files.length; i++) {
    const url = await saveUpload(files[i]);
    urls.push(url);
    await pool.query(
      'INSERT INTO reportes_seguimiento_imagenes (id_reporte, url, orden) VALUES (?,?,?)',
      [idReporte, url, i]
    );
  }

  const proximo = calcProximoReporte(seguimiento.frecuencia_reporte, new Date());
  await pool.query('UPDATE seguimientos_adopcion SET proximo_reporte = ? WHERE id = ?', [
    proximo,
    seguimiento.id,
  ]);

  const detalle = files.length
    ? `${req.user.nombre} envió un reporte${files.length ? ` con ${files.length} foto(s)` : ''} de ${seguimiento.mascota_nombre}.`
    : `${req.user.nombre} envió un reporte (sin fotos) de ${seguimiento.mascota_nombre}.`;

  await notificarAdminsRefugio(
    seguimiento.id_refugio,
    'Nuevo reporte post-adopción',
    detalle
  );

  const [reportes] = await pool.query('SELECT * FROM reportes_seguimiento WHERE id = ?', [idReporte]);
  const imagenes = urls.map((url, i) => ({ url, orden: i }));

  success(res, { reporte: { ...reportes[0], imagenes } }, 'Reporte enviado correctamente', 201);
});

export const getAdminLista = asyncHandler(async (req, res) => {
  const params = [];
  let sql = `${SEGUIMIENTO_SELECT} WHERE sg.estado = 'activo'`;
  if (req.refugioId) {
    sql += ' AND sg.id_refugio = ?';
    params.push(req.refugioId);
  }
  sql += ' ORDER BY sg.proximo_reporte ASC';

  const [seguimientos] = await pool.query(sql, params);

  const enriched = await Promise.all(
    seguimientos.map(async (s) => {
      const [[{ total }]] = await pool.query(
        'SELECT COUNT(*) AS total FROM reportes_seguimiento WHERE id_seguimiento = ?',
        [s.id]
      );
      const [[{ pendientes }]] = await pool.query(
        `SELECT COUNT(*) AS pendientes FROM reportes_seguimiento
         WHERE id_seguimiento = ? AND estado = 'enviado'`,
        [s.id]
      );
      return {
        ...s,
        total_reportes: total,
        reportes_sin_revisar: pendientes,
        estado_reporte: estadoReporteSeguimiento(s),
      };
    })
  );

  success(res, { seguimientos: enriched });
});

export const getAdminDetalle = asyncHandler(async (req, res) => {
  const seguimiento = await assertSeguimientoAdmin(req.params.id, req.refugioId);
  if (!seguimiento) return error(res, 'Seguimiento no encontrado', 404);

  const reportes = await getReportesConImagenes(seguimiento.id);
  success(res, {
    seguimiento: { ...seguimiento, estado_reporte: estadoReporteSeguimiento(seguimiento) },
    reportes,
  });
});

export const revisarReporte = asyncHandler(async (req, res) => {
  const { notas_admin } = req.body;
  const idReporte = req.params.idReporte;

  const [reportes] = await pool.query(
    `SELECT rs.*, sg.id_refugio, sg.id_usuario, m.nombre AS mascota_nombre
     FROM reportes_seguimiento rs
     JOIN seguimientos_adopcion sg ON rs.id_seguimiento = sg.id
     JOIN mascotas m ON sg.id_mascota = m.id
     WHERE rs.id = ?`,
    [idReporte]
  );
  if (!reportes.length) return error(res, 'Reporte no encontrado', 404);

  const reporte = reportes[0];
  if (req.refugioId && reporte.id_refugio !== req.refugioId) {
    return error(res, 'No autorizado para este refugio', 403);
  }
  req.auditBefore = reporte;

  await pool.query(
    'UPDATE reportes_seguimiento SET estado = ?, notas_admin = ? WHERE id = ?',
    ['revisado', notas_admin?.trim() || null, idReporte]
  );

  await crearNotificacion(
    reporte.id_usuario,
    'Reporte revisado',
    `El refugio revisó tus fotos de ${reporte.mascota_nombre}.`
  );

  const [updated] = await pool.query('SELECT * FROM reportes_seguimiento WHERE id = ?', [idReporte]);
  req.auditAfter = updated[0] || null;
  success(res, { reporte: updated[0] }, 'Reporte marcado como revisado');
});
