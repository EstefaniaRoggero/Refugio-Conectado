import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';
import { getDefaultRefugioId } from '../utils/lookups.js';
import {
  TURNO_SELECT,
  validarTurno,
  mapTurnoRow,
} from '../services/voluntarioTurnoService.js';

async function getVoluntarioAprobado(idUsuario, idRefugio) {
  const [rows] = await pool.query(
    `SELECT id, estado FROM voluntarios
     WHERE id_usuario = ? AND id_refugio = ? AND estado = 'aprobado'`,
    [idUsuario, idRefugio]
  );
  return rows[0] || null;
}

async function getTurnoConPermiso(idTurno, req) {
  const [rows] = await pool.query(`${TURNO_SELECT} WHERE t.id = ?`, [idTurno]);
  if (!rows.length) return null;
  const turno = rows[0];
  if (req.user.rol === 'admin' && turno.id_refugio === req.refugioId) return turno;
  const vol = await getVoluntarioAprobado(req.user.id, turno.id_refugio);
  if (vol && vol.id === turno.id_voluntario) return turno;
  return null;
}

export const registrarVoluntario = asyncHandler(async (req, res) => {
  const { disponibilidad, experiencia, habilidades, transporte, tarea, id_refugio } = req.body;

  const [existing] = await pool.query(
    "SELECT id FROM voluntarios WHERE id_usuario = ? AND id_refugio = ? AND estado IN ('pendiente', 'aprobado')",
    [req.user.id, req.refugioId || id_refugio]
  );
  if (existing.length) return error(res, 'Ya tienes una solicitud de voluntariado activa en este refugio', 409);

  const idRefugio = req.refugioId || id_refugio || await getDefaultRefugioId();

  const [result] = await pool.query(
    `INSERT INTO voluntarios (id_usuario, id_refugio, disponibilidad, tarea, experiencia, habilidades, transporte)
     VALUES (?,?,?,?,?,?,?)`,
    [req.user.id, idRefugio, disponibilidad, tarea || 'Apoyo general', experiencia, habilidades, transporte ? 1 : 0]
  );

  const [voluntarios] = await pool.query(
    `SELECT v.*, r.nombre AS refugio_nombre FROM voluntarios v
     JOIN refugios r ON v.id_refugio = r.id_refugio WHERE v.id = ?`,
    [result.insertId]
  );
  success(res, { voluntario: voluntarios[0] }, 'Solicitud de voluntariado enviada', 201);
});

export const getMiVoluntariado = asyncHandler(async (req, res) => {
  const [voluntarios] = await pool.query(
    `SELECT v.*, r.nombre AS refugio_nombre FROM voluntarios v
     JOIN refugios r ON v.id_refugio = r.id_refugio
     WHERE v.id_usuario = ? ORDER BY v.created_at DESC LIMIT 1`,
    [req.user.id]
  );
  success(res, { voluntario: voluntarios[0] || null });
});

export const getAllVoluntarios = asyncHandler(async (req, res) => {
  const params = [];
  let sql = `SELECT v.*, u.nombre, u.apellido, u.email, u.telefono, r.nombre AS refugio_nombre
     FROM voluntarios v
     JOIN usuarios u ON v.id_usuario = u.id
     JOIN refugios r ON v.id_refugio = r.id_refugio`;
  if (req.refugioId) {
    sql += ' WHERE v.id_refugio = ?';
    params.push(req.refugioId);
  }
  sql += ' ORDER BY v.created_at DESC';
  const [voluntarios] = await pool.query(sql, params);
  success(res, { voluntarios });
});

export const actualizarEstadoVoluntario = asyncHandler(async (req, res) => {
  const { estado, notas_admin } = req.body;
  if (!['pendiente', 'aprobado', 'rechazado'].includes(estado)) return error(res, 'Estado inválido', 400);
  const [before] = await pool.query('SELECT * FROM voluntarios WHERE id=? AND id_refugio=?', [req.params.id, req.refugioId]);
  req.auditBefore = before[0] || null;
  const [result] = await pool.query(
    'UPDATE voluntarios SET estado = ?, notas_admin = ? WHERE id = ? AND id_refugio = ?',
    [estado, notas_admin || null, req.params.id, req.refugioId]
  );
  if (!result.affectedRows) return error(res, 'Voluntario no encontrado', 404);
  const [voluntarios] = await pool.query('SELECT * FROM voluntarios WHERE id = ? AND id_refugio=?', [req.params.id, req.refugioId]);
  req.auditAfter = voluntarios[0] || null;
  success(res, { voluntario: voluntarios[0] }, 'Estado actualizado');
});

/** Calendario público: turnos de voluntarios aprobados del refugio */
export const getCalendarioVoluntarios = asyncHandler(async (req, res) => {
  const fullNames = req.user?.rol === 'admin';
  const [rows] = await pool.query(
    `${TURNO_SELECT}
     WHERE t.id_refugio = ? AND v.estado = 'aprobado'
     ORDER BY t.dia_semana ASC, t.hora_inicio ASC`,
    [req.refugioId]
  );
  success(res, { turnos: rows.map((r) => mapTurnoRow(r, { fullNames })) });
});

export const getMisTurnosVoluntario = asyncHandler(async (req, res) => {
  const vol = await getVoluntarioAprobado(req.user.id, req.refugioId);
  if (!vol) return success(res, { turnos: [], voluntario: null });

  const [rows] = await pool.query(
    `${TURNO_SELECT}
     WHERE t.id_voluntario = ?
     ORDER BY t.dia_semana ASC, t.hora_inicio ASC`,
    [vol.id]
  );
  success(res, {
    voluntario: { id: vol.id, estado: 'aprobado' },
    turnos: rows.map((r) => mapTurnoRow(r, { fullNames: true })),
  });
});

export const crearTurnoVoluntario = asyncHandler(async (req, res) => {
  const { dia_semana, hora_inicio, hora_fin, notas, id_voluntario } = req.body;
  const errMsg = validarTurno({ dia_semana, hora_inicio, hora_fin });
  if (errMsg) return error(res, errMsg, 400);

  let idVoluntario = id_voluntario;

  if (req.user.rol === 'admin') {
    if (!idVoluntario) return error(res, 'Debe indicar el voluntario', 400);
    const [vol] = await pool.query(
      'SELECT id FROM voluntarios WHERE id = ? AND id_refugio = ? AND estado = ?',
      [idVoluntario, req.refugioId, 'aprobado']
    );
    if (!vol.length) return error(res, 'Voluntario no encontrado o no aprobado', 404);
  } else {
    const vol = await getVoluntarioAprobado(req.user.id, req.refugioId);
    if (!vol) {
      return error(res, 'Solo voluntarios aprobados pueden registrar turnos en el calendario', 403);
    }
    idVoluntario = vol.id;
  }

  const [result] = await pool.query(
    `INSERT INTO voluntario_turnos (id_voluntario, id_refugio, dia_semana, hora_inicio, hora_fin, notas)
     VALUES (?,?,?,?,?,?)`,
    [idVoluntario, req.refugioId, dia_semana, hora_inicio, hora_fin, notas || null]
  );

  const [rows] = await pool.query(`${TURNO_SELECT} WHERE t.id = ?`, [result.insertId]);
  success(res, { turno: mapTurnoRow(rows[0], { fullNames: true }) }, 'Turno registrado', 201);
});

export const eliminarTurnoVoluntario = asyncHandler(async (req, res) => {
  const turno = await getTurnoConPermiso(req.params.id, req);
  if (!turno) return error(res, 'Turno no encontrado o sin permiso', 404);

  await pool.query('DELETE FROM voluntario_turnos WHERE id = ? AND id_refugio = ?', [req.params.id, turno.id_refugio]);
  success(res, null, 'Turno eliminado');
});
