import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';

export const getMisNotificaciones = asyncHandler(async (req, res) => {
  const [notificaciones] = await pool.query(
    'SELECT * FROM notificaciones WHERE id_usuario = ? ORDER BY created_at DESC LIMIT 50',
    [req.user.id]
  );
  const [[{ no_leidas }]] = await pool.query(
    'SELECT COUNT(*) AS no_leidas FROM notificaciones WHERE id_usuario = ? AND leida = 0',
    [req.user.id]
  );
  success(res, { notificaciones, no_leidas });
});

export const marcarLeida = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'UPDATE notificaciones SET leida = 1 WHERE id = ? AND id_usuario = ?',
    [req.params.id, req.user.id]
  );
  if (!result.affectedRows) return error(res, 'Notificación no encontrada', 404);
  success(res, null, 'Notificación marcada como leída');
});
