import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';

export const getRazas = asyncHandler(async (req, res) => {
  const { tipo, id_tipo_mascota } = req.query;
  let sql = `
    SELECT rz.*, tm.codigo AS tipo_codigo, tm.tipo AS tipo_nombre
    FROM razas rz
    JOIN tipos_mascota tm ON rz.id_tipo_mascota = tm.id_tipo_mascota
    WHERE rz.activo = 1`;
  const params = [];

  if (id_tipo_mascota) {
    sql += ' AND rz.id_tipo_mascota = ?';
    params.push(id_tipo_mascota);
  } else if (tipo) {
    sql += ' AND tm.codigo = ?';
    params.push(tipo);
  }

  sql += ' ORDER BY tm.tipo, rz.nombre';

  const [razas] = await pool.query(sql, params);
  success(res, { razas });
});

export const getTiposMascota = asyncHandler(async (req, res) => {
  const [tipos] = await pool.query('SELECT * FROM tipos_mascota ORDER BY tipo');
  success(res, { tipos });
});
