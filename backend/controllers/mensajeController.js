import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';

export const crearMensaje = asyncHandler(async (req, res) => {
  const { nombre, email, asunto, mensaje } = req.body;

  const [result] = await pool.query(
    'INSERT INTO mensajes (usuario_id, id_refugio, nombre, email, asunto, mensaje) VALUES (?,?,?,?,?,?)',
    [req.user?.id || null, req.refugioId, nombre, email, asunto, mensaje]
  );

  const [mensajes] = await pool.query('SELECT * FROM mensajes WHERE id = ?', [result.insertId]);
  success(res, { mensaje: mensajes[0] }, 'Mensaje enviado. Te contactaremos pronto.', 201);
});

export const getMensajes = asyncHandler(async (req, res) => {
  const params = [];
  let sql = 'SELECT * FROM mensajes';
  if (req.refugioId) {
    sql += ' WHERE id_refugio = ?';
    params.push(req.refugioId);
  }
  sql += ' ORDER BY created_at DESC';
  const [mensajes] = await pool.query(sql, params);
  success(res, { mensajes });
});

export const marcarLeido = asyncHandler(async (req, res) => {
  const params = [req.params.id];
  let sql = 'UPDATE mensajes SET leido = 1 WHERE id = ?';
  if (req.refugioId) {
    sql += ' AND id_refugio = ?';
    params.push(req.refugioId);
  }
  await pool.query(sql, params);
  success(res, null, 'Mensaje marcado como leído');
});

export const eliminarMensaje = asyncHandler(async (req, res) => {
  const params = [req.params.id];
  let sql = 'DELETE FROM mensajes WHERE id = ?';
  if (req.refugioId) {
    sql += ' AND id_refugio = ?';
    params.push(req.refugioId);
  }
  await pool.query(sql, params);
  success(res, null, 'Mensaje eliminado');
});
