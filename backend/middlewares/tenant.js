import { asyncHandler } from '../utils/asyncHandler.js';
import { getRefugioBySlug } from '../utils/lookups.js';
import pool from '../config/database.js';

export const resolveTenant = asyncHandler(async (req, res, next) => {
  const slug = req.headers['x-refugio-slug'];
  if (!slug) return next();

  const refugio = await getRefugioBySlug(slug);
  if (!refugio) {
    return res.status(404).json({ success: false, message: 'Refugio no encontrado' });
  }

  req.refugio = refugio;
  req.refugioId = refugio.id_refugio;
  next();
});

export const requireTenant = (req, res, next) => {
  if (!req.refugioId) {
    return res.status(400).json({
      success: false,
      message: 'Debe indicar el refugio (header X-Refugio-Slug)',
    });
  }
  next();
};

export const assertAdminRefugio = async (req, res, next) => {
  try {
    if (req.user?.rol === 'super_admin') return next();
    if (req.user?.rol !== 'admin') return next();
    if (!req.refugioId) {
      return res.status(400).json({ success: false, message: 'Debe indicar el refugio' });
    }
    const [rows] = await pool.query(
      `SELECT 1 FROM usuarios u
       LEFT JOIN usuarios_refugios ur ON ur.id_usuario=u.id AND ur.id_refugio=?
       WHERE u.id=? AND u.activo=1 AND (ur.id_refugio IS NOT NULL OR u.id_refugio=?) LIMIT 1`,
      [req.refugioId, req.user.id, req.refugioId]
    );
    if (!rows.length) {
      return res.status(403).json({ success: false, message: 'No autorizado para este refugio' });
    }
    next();
  } catch (err) {
    next(err);
  }
};
