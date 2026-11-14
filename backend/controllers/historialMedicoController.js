import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';

export const getHistorialByMascota = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [mascota] = await pool.query(
    `SELECT id FROM mascotas WHERE id = ?${req.refugioId ? ' AND id_refugio = ?' : ''}`,
    req.refugioId ? [id, req.refugioId] : [id]
  );
  if (!mascota.length) return error(res, 'Mascota no encontrada', 404);

  const [historial] = await pool.query(
    `SELECT * FROM historial_medico_mascota WHERE id_mascota = ? ORDER BY fecha DESC, id_historial DESC`,
    [id]
  );

  const [proximas] = await pool.query(
    `SELECT * FROM historial_medico_mascota
     WHERE id_mascota = ? AND proxima_dosis IS NOT NULL AND proxima_dosis >= CURDATE()
     ORDER BY proxima_dosis ASC`,
    [id]
  );

  success(res, { historial, proximasDosis: proximas });
});
export const crearRegistro = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tipo, procedimiento, descripcion, fecha, veterinario, proxima_dosis, lote } = req.body;

  const [mascota] = await pool.query('SELECT id FROM mascotas WHERE id=? AND id_refugio=?', [id, req.refugioId]);
  if (!mascota.length) return error(res, 'Mascota no encontrada', 404);

  const [result] = await pool.query(
    `INSERT INTO historial_medico_mascota (id_mascota, tipo, procedimiento, descripcion, fecha, veterinario, proxima_dosis, lote)
     VALUES (?,?,?,?,?,?,?,?)`,
    [id, tipo, procedimiento, descripcion || null, fecha, veterinario || null, proxima_dosis || null, lote || null]
  );

  const [registro] = await pool.query('SELECT * FROM historial_medico_mascota WHERE id_historial = ?', [result.insertId]);
  success(res, { registro: registro[0] }, 'Registro médico creado', 201);
});

export const actualizarRegistro = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tipo, procedimiento, descripcion, fecha, veterinario, proxima_dosis, lote } = req.body;

  const [result] = await pool.query(
    `UPDATE historial_medico_mascota h
     JOIN mascotas m ON m.id=h.id_mascota
     SET h.tipo=?, h.procedimiento=?, h.descripcion=?, h.fecha=?, h.veterinario=?, h.proxima_dosis=?, h.lote=?
     WHERE h.id_historial=? AND m.id_refugio=?`,
    [tipo, procedimiento, descripcion, fecha, veterinario, proxima_dosis, lote, id, req.refugioId]
  );
  if (!result.affectedRows) return error(res, 'Registro no encontrado', 404);

  const [registro] = await pool.query('SELECT * FROM historial_medico_mascota WHERE id_historial = ?', [id]);
  success(res, { registro: registro[0] }, 'Registro actualizado');
});

export const eliminarRegistro = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    `DELETE h FROM historial_medico_mascota h
     JOIN mascotas m ON m.id=h.id_mascota
     WHERE h.id_historial=? AND m.id_refugio=?`,
    [req.params.id, req.refugioId]
  );
  if (!result.affectedRows) return error(res, 'Registro no encontrado', 404);
  success(res, null, 'Registro eliminado');
});
