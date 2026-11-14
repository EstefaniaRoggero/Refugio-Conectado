import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';

export const getFavoritos = asyncHandler(async (req, res) => {
  const params = [req.user.id];
  let sql = `SELECT m.* FROM favoritos f JOIN mascotas m ON f.mascota_id = m.id
     WHERE f.usuario_id = ?`;
  if (req.refugioId) {
    sql += ' AND m.id_refugio = ?';
    params.push(req.refugioId);
  }
  sql += ' ORDER BY f.created_at DESC';
  const [favoritos] = await pool.query(sql, params);
  success(res, { favoritos });
});

export const toggleFavorito = asyncHandler(async (req, res) => {
  const { mascota_id } = req.body;
  const [existing] = await pool.query(
    'SELECT id FROM favoritos WHERE usuario_id = ? AND mascota_id = ?',
    [req.user.id, mascota_id]
  );

  if (existing.length) {
    await pool.query('DELETE FROM favoritos WHERE id = ?', [existing[0].id]);
    return success(res, { favorito: false }, 'Eliminado de favoritos');
  }

  await pool.query('INSERT INTO favoritos (usuario_id, mascota_id) VALUES (?, ?)', [req.user.id, mascota_id]);
  success(res, { favorito: true }, 'Agregado a favoritos', 201);
});
