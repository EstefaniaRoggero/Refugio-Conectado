import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/** Solo adoptantes, donantes y voluntarios entran con Google; admins y superadmins usan contraseña. */
export const ROLES_CON_GOOGLE = ['usuario', 'voluntario'];

export function rolPermiteGoogle(rol) {
  return ROLES_CON_GOOGLE.includes(rol);
}

export function correoGoogleVerificado(payload) {
  return payload?.email_verified === true || payload?.email_verified === 'true';
}

export function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** Identifica la cuenta en los registros de intentos sin guardar el correo en claro. */
export function claveDeEmail(email) {
  return crypto.createHash('sha256').update(normalizarEmail(email)).digest('hex');
}

let hashFicticio = null;

/** Iguala el tiempo de respuesta cuando el correo no existe, para no revelar qué cuentas hay. */
export async function compararSinCuenta(password) {
  hashFicticio ??= bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
  await bcrypt.compare(String(password || ''), await hashFicticio);
  return false;
}

/** El token de recuperación solo viaja en la respuesta en desarrollo y con permiso explícito. */
export function exponerTokenReset(env = process.env) {
  return env.NODE_ENV === 'development' && env.DEV_EXPONER_TOKEN_RESET === 'true';
}
