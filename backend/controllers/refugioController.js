import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';
import { getRefugioBySlug } from '../utils/lookups.js';

export const listRefugios = asyncHandler(async (req, res) => {
  const [refugios] = await pool.query(
    `SELECT id_refugio, nombre, slug, direccion, descripcion, telefono, email, ciudad, latitud, longitud
     FROM refugios
     WHERE activo = 1 AND slug IS NOT NULL
     ORDER BY ciudad, nombre`
  );
  success(res, { refugios });
});

export const getRefugioBySlugHandler = asyncHandler(async (req, res) => {
  const refugio = await getRefugioBySlug(req.params.slug);
  if (!refugio) return error(res, 'Refugio no encontrado', 404);
  success(res, { refugio });
});
