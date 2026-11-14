import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { USUARIO_SELECT } from '../utils/lookups.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No autorizado. Inicia sesión.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(`${USUARIO_SELECT} WHERE u.id = ?`, [decoded.id]);

    if (!rows.length || !rows[0].activo) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Sesión expirada o inválida' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.rol)) {
    return res.status(403).json({ success: false, message: 'No tienes permisos para esta acción' });
  }
  next();
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [rows] = await pool.query(
        `${USUARIO_SELECT} WHERE u.id = ?`,
        [decoded.id]
      );
      if (rows.length && rows[0].activo) req.user = rows[0];
    }
  } catch {
    /* usuario anónimo */
  }
  next();
};
