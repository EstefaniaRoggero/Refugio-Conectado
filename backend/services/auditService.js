import pool from '../config/database.js';

const SECRET_FIELDS = new Set(['password', 'password_actual', 'password_nueva', 'token', 'credential']);

function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, SECRET_FIELDS.has(key) ? '[PROTEGIDO]' : sanitize(item)])
  );
}

export async function recordActivity({
  userId = null,
  refugioId = null,
  role = null,
  action,
  entity = null,
  entityId = null,
  result = 'exito',
  data = null,
  ip = null,
  userAgent = null,
}) {
  await pool.query(
    `INSERT INTO registros_actividad
      (id_usuario, id_refugio, rol_actor, accion, entidad, entidad_id, resultado, datos, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, refugioId, role, action, entity, entityId, result, data ? JSON.stringify(sanitize(data)) : null, ip, userAgent]
  );
}

export function auditMutations(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();

  res.on('finish', () => {
    if (!req.user) return;
    const segments = req.baseUrl.split('/').filter(Boolean);
    const entity = req.path.split('/').filter(Boolean)[0] || segments.at(-1) || 'sistema';
    recordActivity({
      userId: req.user.id,
      refugioId: req.refugioId || null,
      role: req.user.rol,
      action: `${req.method} ${req.baseUrl}${req.path}`,
      entity,
      entityId: req.params?.id || req.params?.idReporte || null,
      result: res.statusCode < 400 ? 'exito' : 'error',
      data: {
        params: req.params,
        anterior: req.auditBefore || null,
        posterior: req.auditAfter || req.body,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((err) => console.warn('No se pudo registrar actividad:', err.message));
  });

  next();
}

