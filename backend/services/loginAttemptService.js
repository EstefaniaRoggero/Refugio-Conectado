import pool from '../config/database.js';
import { claveDeEmail } from '../utils/authSecurity.js';

export const MAX_FALLOS_LOGIN = 5;
export const VENTANA_BLOQUEO_MIN = 15;
export const MENSAJE_BLOQUEO = `Demasiados intentos fallidos. Esperá ${VENTANA_BLOQUEO_MIN} minutos e intentá de nuevo.`;

const ACCION_FALLO = 'LOGIN_FALLIDO';
const ACCIONES_EXITO = ['LOGIN_ADMIN', 'LOGIN_SUPER_ADMIN'];

/**
 * Bloqueo por cuenta guardado en registros_actividad: funciona igual en todas las instancias
 * de Vercel. Los éxitos se registran con la misma clave, y solo cuentan los fallos posteriores.
 */
export function crearControlIntentos(db = pool, { maxFallos = MAX_FALLOS_LOGIN, ventanaMin = VENTANA_BLOQUEO_MIN } = {}) {
  async function estaBloqueado(email) {
    const clave = claveDeEmail(email);
    try {
      const [[fila]] = await db.query(
        `SELECT COUNT(*) AS fallos FROM registros_actividad
         WHERE accion = ? AND entidad_id = ?
           AND created_at >= NOW() - INTERVAL ? MINUTE
           AND id > COALESCE(
             (SELECT MAX(id) FROM registros_actividad WHERE accion IN (?) AND entidad_id = ?), 0)`,
        [ACCION_FALLO, clave, ventanaMin, ACCIONES_EXITO, clave]
      );
      return Number(fila?.fallos || 0) >= maxFallos;
    } catch (err) {
      console.error('[login] no se pudo consultar el bloqueo:', err.message);
      return false;
    }
  }

  async function registrarFallo(email, { tipo, ip = null, userAgent = null } = {}) {
    try {
      await db.query(
        `INSERT INTO registros_actividad (rol_actor, accion, entidad, entidad_id, resultado, datos, ip, user_agent)
         VALUES (NULL, ?, 'login', ?, 'error', ?, ?, ?)`,
        [ACCION_FALLO, claveDeEmail(email), JSON.stringify({ tipo }), ip, userAgent]
      );
    } catch (err) {
      console.error('[login] no se pudo registrar el intento fallido:', err.message);
    }
  }

  return { estaBloqueado, registrarFallo, claveExito: claveDeEmail };
}

export const controlIntentos = crearControlIntentos();
