import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';
import { recordActivity } from '../services/auditService.js';
import { controlIntentos, MENSAJE_BLOQUEO } from '../services/loginAttemptService.js';
import { compararSinCuenta } from '../utils/authSecurity.js';

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
});

const normalizeSlug = (value = '') => value
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const parseIds = (ids) => [...new Set((Array.isArray(ids) ? ids : []).map(Number).filter(Number.isInteger))];

export const loginSuperAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (await controlIntentos.estaBloqueado(email)) return error(res, MENSAJE_BLOQUEO, 429);

  const [rows] = await pool.query(
    `SELECT u.*, ro.nombre_rol AS rol FROM usuarios u
     JOIN roles ro ON ro.id_rol=u.id_rol WHERE u.email = ? AND u.activo = 1`,
    [String(email || '').trim().toLowerCase()]
  );
  const user = rows[0];
  const valida = user?.rol === 'super_admin' && user.password
    ? await bcrypt.compare(password || '', user.password)
    : await compararSinCuenta(password);
  if (!valida) {
    await controlIntentos.registrarFallo(email, { tipo: 'super_admin', ip: req.ip, userAgent: req.get('user-agent') });
    return error(res, 'Credenciales incorrectas', 401);
  }
  await recordActivity({ userId: user.id, role: user.rol, action: 'LOGIN_SUPER_ADMIN', entity: 'sesion', entityId: controlIntentos.claveExito(email), ip: req.ip, userAgent: req.get('user-agent') });
  const { password: _password, ...safeUser } = user;
  success(res, { user: safeUser, token: generateToken(user.id) }, 'Inicio de sesión exitoso');
});

export const getOverview = asyncHandler(async (req, res) => {
  const [refugios] = await pool.query(`
    SELECT r.id_refugio, r.nombre, r.slug, r.ciudad, r.activo,
      (SELECT COUNT(*) FROM mascotas m WHERE m.id_refugio = r.id_refugio) AS mascotas,
      (SELECT COUNT(*) FROM mascotas m JOIN estados_mascota em ON em.id_estado_mascota=m.id_estado_mascota WHERE m.id_refugio=r.id_refugio AND em.codigo='disponible') AS disponibles,
      (SELECT COUNT(*) FROM solicitudes_adopcion s JOIN mascotas m ON m.id=s.id_mascota WHERE m.id_refugio=r.id_refugio) AS solicitudes,
      (SELECT COUNT(*) FROM solicitudes_adopcion s JOIN mascotas m ON m.id=s.id_mascota JOIN estados_solicitud_adopcion es ON es.id_estado_solicitud=s.id_estado_solicitud WHERE m.id_refugio=r.id_refugio AND es.codigo='aprobada') AS adopciones,
      (SELECT COALESCE(SUM(d.monto),0) FROM donaciones d WHERE d.id_refugio=r.id_refugio AND d.estado='completada') AS donaciones,
      (SELECT COUNT(*) FROM voluntarios v WHERE v.id_refugio=r.id_refugio AND v.estado='aprobado') AS voluntarios,
      (SELECT COUNT(*) FROM usuarios_refugios ur WHERE ur.id_refugio=r.id_refugio) AS administradores
    FROM refugios r
    ORDER BY r.activo DESC, r.ciudad, r.nombre
  `);
  const totales = refugios.reduce((acc, row) => ({
    refugios: acc.refugios + (row.activo ? 1 : 0),
    mascotas: acc.mascotas + Number(row.mascotas),
    solicitudes: acc.solicitudes + Number(row.solicitudes),
    adopciones: acc.adopciones + Number(row.adopciones),
    donaciones: acc.donaciones + Number(row.donaciones),
  }), { refugios: 0, mascotas: 0, solicitudes: 0, adopciones: 0, donaciones: 0 });
  const [[globales]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM usuarios WHERE activo=1) usuarios,
      (SELECT COUNT(*) FROM mascotas WHERE publicada=1) mascotas_publicadas,
      (SELECT COUNT(*) FROM solicitudes_refugio WHERE estado='pendiente') solicitudes_refugio_pendientes,
      (SELECT COUNT(*) FROM solicitudes_adopcion s JOIN estados_solicitud_adopcion e ON e.id_estado_solicitud=s.id_estado_solicitud WHERE e.codigo='pendiente') solicitudes_adopcion_pendientes,
      (SELECT COUNT(*) FROM donaciones) donaciones_registradas
  `);
  totales.usuarios = Number(globales.usuarios);
  totales.mascotas_publicadas = Number(globales.mascotas_publicadas);
  totales.solicitudes_pendientes = Number(globales.solicitudes_refugio_pendientes) + Number(globales.solicitudes_adopcion_pendientes);
  totales.donaciones_registradas = Number(globales.donaciones_registradas);
  totales.refugios_inactivos = refugios.filter((refugio) => !refugio.activo).length;
  const [recentActivity] = await pool.query(`
    SELECT a.id,a.accion,a.entidad,a.resultado,a.created_at,CONCAT(u.nombre,' ',u.apellido) actor
    FROM registros_actividad a LEFT JOIN usuarios u ON u.id=a.id_usuario
    ORDER BY a.created_at DESC LIMIT 8
  `);
  success(res, { totales, refugios, recentActivity });
});

export const listRefugiosAdmin = asyncHandler(async (req, res) => {
  const [refugios] = await pool.query(`
    SELECT r.*, z.nombre zona,
      (SELECT COUNT(*) FROM mascotas m WHERE m.id_refugio=r.id_refugio AND m.publicada=1) mascotas_publicadas,
      (SELECT COUNT(*) FROM mascotas m JOIN estados_mascota e ON e.id_estado_mascota=m.id_estado_mascota WHERE m.id_refugio=r.id_refugio AND e.codigo='adoptado') adopciones,
      (SELECT GROUP_CONCAT(DISTINCT CONCAT(u.nombre,' ',u.apellido) ORDER BY u.nombre SEPARATOR ', ')
       FROM usuarios_refugios ur JOIN usuarios u ON u.id=ur.id_usuario JOIN roles ro ON ro.id_rol=u.id_rol
       WHERE ur.id_refugio=r.id_refugio AND ro.nombre_rol='admin' AND u.activo=1) responsables
    FROM refugios r
    LEFT JOIN zonas z ON z.id_zona=r.id_zona
    ORDER BY r.activo DESC, r.ciudad, r.nombre
  `);
  success(res, { refugios });
});

export const createRefugio = asyncHandler(async (req, res) => {
  const { nombre, direccion, descripcion, telefono, email, ciudad, latitud, longitud } = req.body;
  const activo = req.body.activo !== false && Number(req.body.activo) !== 0;
  const slug = normalizeSlug(req.body.slug || nombre);
  if (!nombre?.trim() || !slug || !ciudad?.trim()) return error(res, 'Nombre, slug y ciudad son obligatorios', 400);
  const [result] = await pool.query(
    `INSERT INTO refugios (nombre, slug, direccion, descripcion, telefono, email, ciudad, id_zona, latitud, longitud, activo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre.trim(), slug, direccion || null, descripcion || null, telefono || null, email || null, ciudad.trim(), req.body.id_zona || null, latitud || null, longitud || null, activo ? 1 : 0]
  );
  success(res, { id_refugio: result.insertId, slug }, 'Refugio creado', 201);
});

export const updateRefugio = asyncHandler(async (req, res) => {
  const { nombre, direccion, descripcion, telefono, email, ciudad, latitud, longitud, activo } = req.body;
  const slug = normalizeSlug(req.body.slug || nombre);
  if (!nombre?.trim() || !slug || !ciudad?.trim()) return error(res, 'Nombre, slug y ciudad son obligatorios', 400);
  const [before] = await pool.query('SELECT * FROM refugios WHERE id_refugio=?', [req.params.id]);
  req.auditBefore = before[0] || null;
  const [result] = await pool.query(
    `UPDATE refugios SET nombre=?, slug=?, direccion=?, descripcion=?, telefono=?, email=?, ciudad=?, id_zona=?, latitud=?, longitud=?, activo=?
     WHERE id_refugio=?`,
    [nombre.trim(), slug, direccion || null, descripcion || null, telefono || null, email || null, ciudad.trim(), req.body.id_zona || null, latitud || null, longitud || null, activo ? 1 : 0, req.params.id]
  );
  if (!result.affectedRows) return error(res, 'Refugio no encontrado', 404);
  const [after] = await pool.query('SELECT * FROM refugios WHERE id_refugio=?', [req.params.id]);
  req.auditAfter = after[0] || null;
  success(res, null, 'Refugio actualizado');
});

export const listAdmins = asyncHandler(async (req, res) => {
  const [admins] = await pool.query(`
    SELECT u.id, u.nombre, u.apellido, u.email, u.activo, u.created_at, ro.nombre_rol AS rol,
      GROUP_CONCAT(ur.id_refugio ORDER BY ur.id_refugio) AS refugio_ids,
      GROUP_CONCAT(r.nombre ORDER BY r.nombre SEPARATOR ', ') AS refugios
    FROM usuarios u
    JOIN roles ro ON ro.id_rol=u.id_rol
    LEFT JOIN usuarios_refugios ur ON ur.id_usuario=u.id
    LEFT JOIN refugios r ON r.id_refugio=ur.id_refugio
    WHERE ro.nombre_rol IN ('admin','super_admin')
    GROUP BY u.id, ro.nombre_rol
    ORDER BY ro.nombre_rol DESC, u.nombre, u.apellido
  `);
  success(res, { admins: admins.map((a) => ({ ...a, refugio_ids: a.refugio_ids ? a.refugio_ids.split(',').map(Number) : [] })) });
});

async function replaceAdminRefugios(connection, userId, refugioIds) {
  await connection.query('DELETE FROM usuarios_refugios WHERE id_usuario = ?', [userId]);
  for (const [index, refugioId] of refugioIds.entries()) {
    await connection.query(
      'INSERT INTO usuarios_refugios (id_usuario, id_refugio, es_principal) VALUES (?, ?, ?)',
      [userId, refugioId, index === 0 ? 1 : 0]
    );
  }
  await connection.query('UPDATE usuarios SET id_refugio = ? WHERE id = ?', [refugioIds[0] || null, userId]);
}

async function createInvitation(connection, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await connection.query('UPDATE invitaciones_admin SET used=1 WHERE id_usuario=? AND used=0', [userId]);
  await connection.query(
    'INSERT INTO invitaciones_admin (id_usuario, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 48 HOUR))',
    [userId, tokenHash]
  );
  return token;
}

export const createAdmin = asyncHandler(async (req, res) => {
  const { nombre, apellido, email, rol = 'admin' } = req.body;
  const refugioIds = parseIds(req.body.refugio_ids);
  if (!nombre?.trim() || !apellido?.trim() || !email?.trim()) {
    return error(res, 'Nombre, apellido y email son obligatorios', 400);
  }
  if (!['admin', 'super_admin'].includes(rol)) return error(res, 'Rol inválido', 400);
  if (rol === 'admin' && !refugioIds.length) return error(res, 'Seleccioná al menos un refugio', 400);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[role]] = await connection.query('SELECT id_rol FROM roles WHERE nombre_rol=?', [rol]);
    const hashed = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
    const [result] = await connection.query(
      `INSERT INTO usuarios (nombre, apellido, email, password, id_rol, id_refugio, auth_provider, activo)
       VALUES (?, ?, ?, ?, ?, ?, 'local', 1)`,
      [nombre.trim(), apellido.trim(), email.trim().toLowerCase(), hashed, role.id_rol, rol === 'admin' ? refugioIds[0] : null]
    );
    if (rol === 'admin') await replaceAdminRefugios(connection, result.insertId, refugioIds);
    const invitationToken = await createInvitation(connection, result.insertId);
    await connection.commit();
    success(res, { id: result.insertId, invitationToken }, 'Administrador creado. La invitación vence en 48 horas.', 201);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

export const renewAdminInvitation = asyncHandler(async (req, res) => {
  const [users] = await pool.query(
    `SELECT u.id FROM usuarios u JOIN roles r ON r.id_rol=u.id_rol
     WHERE u.id=? AND r.nombre_rol IN ('admin','super_admin')`,
    [req.params.id]
  );
  if (!users.length) return error(res, 'Administrador no encontrado', 404);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const invitationToken = await createInvitation(connection, users[0].id);
    await connection.commit();
    success(res, { invitationToken }, 'Nueva invitación generada');
  } catch (err) {
    await connection.rollback(); throw err;
  } finally { connection.release(); }
});

export const activateAdminInvitation = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 8) return error(res, 'Token y contraseña de al menos 8 caracteres son obligatorios', 400);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const [rows] = await pool.query(
    `SELECT i.id, i.id_usuario, r.nombre_rol AS rol FROM invitaciones_admin i
     JOIN usuarios u ON u.id=i.id_usuario
     JOIN roles r ON r.id_rol=u.id_rol
     WHERE i.token_hash=? AND i.used=0 AND i.expires_at>NOW() AND u.activo=1 LIMIT 1`,
    [tokenHash]
  );
  if (!rows.length) return error(res, 'La invitación es inválida o venció', 400);
  const hashed = await bcrypt.hash(password, 12);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("UPDATE usuarios SET password=?, auth_provider='local' WHERE id=?", [hashed, rows[0].id_usuario]);
    await connection.query('UPDATE invitaciones_admin SET used=1 WHERE id=?', [rows[0].id]);
    await connection.commit();
    await recordActivity({ userId: rows[0].id_usuario, role: rows[0].rol, action: 'ACTIVAR_CUENTA_ADMIN', entity: 'usuarios', entityId: rows[0].id_usuario, ip: req.ip, userAgent: req.get('user-agent') });
    success(res, { rol: rows[0].rol }, 'Contraseña configurada. Ya podés iniciar sesión.');
  } catch (err) {
    await connection.rollback(); throw err;
  } finally { connection.release(); }
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, apellido, email, password, rol = 'admin', activo = true } = req.body;
  const refugioIds = parseIds(req.body.refugio_ids);
  if (!nombre?.trim() || !apellido?.trim() || !email?.trim()) return error(res, 'Nombre, apellido y email son obligatorios', 400);
  if (id === req.user.id && (!activo || rol !== 'super_admin')) return error(res, 'No podés desactivar ni quitar tu propio acceso global', 400);
  if (!['admin', 'super_admin'].includes(rol)) return error(res, 'Rol inválido', 400);
  if (rol === 'admin' && !refugioIds.length) return error(res, 'Seleccioná al menos un refugio', 400);
  if (password && password.length < 8) return error(res, 'La contraseña debe tener al menos 8 caracteres', 400);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [before] = await connection.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.activo, r.nombre_rol AS rol,
       GROUP_CONCAT(ur.id_refugio) AS refugio_ids
       FROM usuarios u JOIN roles r ON r.id_rol=u.id_rol
       LEFT JOIN usuarios_refugios ur ON ur.id_usuario=u.id WHERE u.id=? GROUP BY u.id`,
      [id]
    );
    req.auditBefore = before[0] || null;
    const [[role]] = await connection.query('SELECT id_rol FROM roles WHERE nombre_rol=?', [rol]);
    const fields = ['nombre=?', 'apellido=?', 'email=?', 'id_rol=?', 'activo=?'];
    const values = [nombre.trim(), apellido.trim(), email.trim().toLowerCase(), role.id_rol, activo ? 1 : 0];
    if (password) {
      fields.push('password=?');
      values.push(await bcrypt.hash(password, 12));
    }
    values.push(id);
    const [result] = await connection.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id=?`, values);
    if (!result.affectedRows) {
      await connection.rollback();
      return error(res, 'Administrador no encontrado', 404);
    }
    await replaceAdminRefugios(connection, id, rol === 'admin' ? refugioIds : []);
    await connection.commit();
    req.auditAfter = { id, nombre, apellido, email, rol, activo, refugio_ids: rol === 'admin' ? refugioIds : [] };
    success(res, null, 'Administrador actualizado');
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

export const listActivity = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 30));
  const conditions = [];
  const params = [];
  if (req.query.refugio_id) { conditions.push('a.id_refugio=?'); params.push(req.query.refugio_id); }
  if (req.query.usuario_id) { conditions.push('a.id_usuario=?'); params.push(req.query.usuario_id); }
  if (req.query.accion) { conditions.push('(a.accion LIKE ? OR a.entidad LIKE ?)'); params.push(`%${req.query.accion}%`, `%${req.query.accion}%`); }
  if (req.query.modulo) { conditions.push('a.entidad=?'); params.push(req.query.modulo); }
  if (req.query.desde) { conditions.push('a.created_at>=?'); params.push(`${req.query.desde} 00:00:00`); }
  if (req.query.hasta) { conditions.push('a.created_at<=?'); params.push(`${req.query.hasta} 23:59:59`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [[count]] = await pool.query(`SELECT COUNT(*) total FROM registros_actividad a ${where}`, params);
  const [registros] = await pool.query(
    `SELECT a.*, CONCAT(u.nombre, ' ', u.apellido) AS actor, r.nombre AS refugio_nombre
     FROM registros_actividad a
     LEFT JOIN usuarios u ON u.id=a.id_usuario
     LEFT JOIN refugios r ON r.id_refugio=a.id_refugio
     ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );
  success(res, { registros, pagination: { page, limit, total: count.total, pages: Math.ceil(count.total / limit) } });
});

