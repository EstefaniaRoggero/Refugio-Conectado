import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';
import { USUARIO_SELECT, getCatalogId } from '../utils/lookups.js';
import { getGoogleClientOptions } from '../config/outboundTls.js';
import { recordActivity } from '../services/auditService.js';
import { controlIntentos, MENSAJE_BLOQUEO } from '../services/loginAttemptService.js';
import { compararSinCuenta, correoGoogleVerificado, exponerTokenReset, rolPermiteGoogle } from '../utils/authSecurity.js';

const getGoogleClient = () => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID no configurado en .env');
  }
  return new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    ...getGoogleClientOptions(),
  });
};

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sanitizeUser = (user) => {
  const { password, ...rest } = user;
  return rest;
};

const mapTipoVivienda = async (tipo) => {
  const map = { casa: 'Casa', departamento: 'Departamento', finca: 'Finca', otro: 'Otro' };
  const nombre = map[tipo] || tipo;
  const [rows] = await pool.query('SELECT id_tipo_vivienda FROM tipos_vivienda WHERE tipo = ? LIMIT 1', [nombre]);
  return rows[0]?.id_tipo_vivienda || 1;
};

export const register = asyncHandler(async (req, res) => {
  error(res, 'El registro de usuarios se realiza iniciando sesión con Google en /login', 400);
});

/** Solo administradores: email + contraseña del sistema */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const intento = { tipo: 'admin', ip: req.ip, userAgent: req.get('user-agent') };
  if (await controlIntentos.estaBloqueado(email)) return error(res, MENSAJE_BLOQUEO, 429);

  const [users] = await pool.query(
    `SELECT u.*, ro.nombre_rol AS rol, tv.tipo AS tipo_vivienda
     FROM usuarios u
     JOIN roles ro ON u.id_rol = ro.id_rol
     LEFT JOIN tipos_vivienda tv ON u.id_tipo_vivienda = tv.id_tipo_vivienda
     WHERE u.email = ? AND u.activo = 1`,
    [email]
  );

  if (!users.length) {
    await compararSinCuenta(password);
    await controlIntentos.registrarFallo(email, intento);
    return error(res, 'Credenciales incorrectas', 401);
  }

  const user = users[0];

  if (!['admin', 'super_admin'].includes(user.rol)) {
    return error(res, 'Los usuarios deben iniciar sesión con Google', 403);
  }

  if (!user.password) {
    return error(res, 'Esta cuenta no tiene contraseña local configurada', 400);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    await controlIntentos.registrarFallo(email, intento);
    return error(res, 'Credenciales incorrectas', 401);
  }

  if (user.rol === 'admin' && req.refugioId) {
    const [memberships] = await pool.query(
      `SELECT 1 FROM usuarios_refugios WHERE id_usuario=? AND id_refugio=?
       UNION SELECT 1 FROM usuarios WHERE id=? AND id_refugio=? LIMIT 1`,
      [user.id, req.refugioId, user.id, req.refugioId]
    );
    if (!memberships.length) return error(res, 'Este administrador no pertenece a este refugio', 403);
  }

  await recordActivity({
    userId: user.id,
    refugioId: req.refugioId || user.id_refugio || null,
    role: user.rol,
    action: 'LOGIN_ADMIN',
    entity: 'sesion',
    entityId: controlIntentos.claveExito(email),
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  success(res, { user: sanitizeUser(user), token: generateToken(user.id) }, 'Inicio de sesión exitoso');
});

/** Usuarios normales: autenticación con Gmail (Google OAuth) */
export const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) return error(res, 'Token de Google requerido', 400);
  if (!process.env.GOOGLE_CLIENT_ID) {
    return error(res, 'GOOGLE_CLIENT_ID no configurado en el servidor backend', 500);
  }

  const client = getGoogleClient();
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    return error(res, 'Token de Google inválido o expirado', 401);
  }

  const payload = ticket.getPayload();
  const googleId = payload.sub;
  const email = payload.email;
  const nombre = payload.given_name || payload.name?.split(' ')[0] || 'Usuario';
  const apellido = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '';
  const avatar = payload.picture || null;

  if (!email) return error(res, 'No se pudo obtener el correo de Google', 400);
  if (!correoGoogleVerificado(payload)) {
    return error(res, 'Tu correo de Google no está verificado. Verificalo en tu cuenta de Google e intentá de nuevo.', 403);
  }

  const [cuentasConEmail] = await pool.query(
    `SELECT r.nombre_rol AS rol FROM usuarios u
     JOIN roles r ON u.id_rol = r.id_rol
     WHERE u.email = ?`,
    [email]
  );
  if (cuentasConEmail.some((cuenta) => !rolPermiteGoogle(cuenta.rol))) {
    return error(res, 'Los administradores deben usar el acceso con email y contraseña', 403);
  }

  let user;

  const [byGoogle] = await pool.query(`${USUARIO_SELECT} WHERE u.google_id = ?`, [googleId]);
  if (byGoogle.length) {
    if (!rolPermiteGoogle(byGoogle[0].rol)) {
      return error(res, 'Los administradores deben usar el acceso con email y contraseña', 403);
    }
    if (!byGoogle[0].activo) return error(res, 'Esta cuenta está desactivada', 403);
    user = byGoogle[0];
    if (avatar && !user.avatar) {
      await pool.query('UPDATE usuarios SET avatar = ? WHERE id = ?', [avatar, user.id]);
      const [updated] = await pool.query(`${USUARIO_SELECT} WHERE u.id = ?`, [user.id]);
      user = updated[0];
    }
  } else {
    const [byEmail] = await pool.query(`${USUARIO_SELECT} WHERE u.email = ?`, [email]);
    if (byEmail.length) {
      if (!byEmail[0].activo) return error(res, 'Esta cuenta está desactivada', 403);
      if (!rolPermiteGoogle(byEmail[0].rol)) {
        return error(res, 'Los administradores deben usar el acceso con email y contraseña', 403);
      }
      await pool.query(
        'UPDATE usuarios SET google_id = ?, auth_provider = ?, avatar = COALESCE(avatar, ?) WHERE id = ?',
        [googleId, 'google', avatar, byEmail[0].id]
      );
      const [updated] = await pool.query(`${USUARIO_SELECT} WHERE u.id = ?`, [byEmail[0].id]);
      user = updated[0];
    } else {
      const idRol = await getCatalogId('rol', 'nombre_rol', 'usuario');
      const [result] = await pool.query(
        `INSERT INTO usuarios (nombre, apellido, email, password, id_rol, google_id, auth_provider, avatar)
         VALUES (?, ?, ?, NULL, ?, ?, 'google', ?)`,
        [nombre, apellido, email, idRol, googleId, avatar]
      );
      const [created] = await pool.query(`${USUARIO_SELECT} WHERE u.id = ?`, [result.insertId]);
      user = created[0];
    }
  }

  success(res, { user: sanitizeUser(user), token: generateToken(user.id) }, 'Inicio de sesión con Google exitoso');
});

export const getProfile = asyncHandler(async (req, res) => {
  success(res, { user: req.user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { nombre, apellido, telefono, direccion, tipo_vivienda, experiencia_mascotas } = req.body;
  const idTipoVivienda = tipo_vivienda ? await mapTipoVivienda(tipo_vivienda) : req.user.id_tipo_vivienda;

  await pool.query(
    `UPDATE usuarios SET nombre=?, apellido=?, telefono=?, direccion=?, id_tipo_vivienda=?, experiencia_mascotas=? WHERE id=?`,
    [nombre, apellido, telefono, direccion, idTipoVivienda, experiencia_mascotas, req.user.id]
  );

  const [users] = await pool.query(`${USUARIO_SELECT} WHERE u.id = ?`, [req.user.id]);
  success(res, { user: users[0] }, 'Perfil actualizado');
});

export const changePassword = asyncHandler(async (req, res) => {
  if (req.user.auth_provider === 'google') {
    return error(res, 'Las cuentas de Google no usan contraseña local', 400);
  }

  const { password_actual, password_nueva } = req.body;
  const [users] = await pool.query('SELECT password FROM usuarios WHERE id = ?', [req.user.id]);

  if (!users[0]?.password) return error(res, 'No hay contraseña local configurada', 400);

  const match = await bcrypt.compare(password_actual, users[0].password);
  if (!match) return error(res, 'Contraseña actual incorrecta', 400);

  const hashed = await bcrypt.hash(password_nueva, 12);
  await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashed, req.user.id]);

  success(res, null, 'Contraseña actualizada');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const [users] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);

  if (!users.length) {
    return success(res, null, 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000);

  await pool.query('DELETE FROM password_resets WHERE usuario_id = ?', [users[0].id]);
  await pool.query(
    'INSERT INTO password_resets (usuario_id, token, expires_at) VALUES (?, ?, ?)',
    [users[0].id, token, expires]
  );

  success(res, {
    mensaje: 'Token generado (en producción se enviaría por email)',
    resetToken: exponerTokenReset() ? token : undefined,
  }, 'Instrucciones enviadas');
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const [resets] = await pool.query(
    `SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()`,
    [token]
  );

  if (!resets.length) return error(res, 'Token inválido o expirado', 400);

  const hashed = await bcrypt.hash(password, 12);
  await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashed, resets[0].usuario_id]);
  await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [resets[0].id]);

  success(res, null, 'Contraseña restablecida correctamente');
});
