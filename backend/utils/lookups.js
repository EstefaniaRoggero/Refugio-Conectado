import pool from '../config/database.js';

/** Consulta base de mascota con catálogos (compatible con API anterior) */
export const MASCOTA_SELECT = `
  SELECT m.*,
    tm.codigo AS tipo, tm.tipo AS tipo_nombre,
    em.codigo AS estado, em.tipo AS estado_nombre,
    rz.id_raza, rz.nombre AS raza_nombre, rz.codigo AS raza_codigo,
    r.nombre AS refugio_nombre, r.id_refugio,
    m.nivel_energia AS energia
  FROM mascotas m
  JOIN tipos_mascota tm ON m.id_tipo_mascota = tm.id_tipo_mascota
  JOIN estados_mascota em ON m.id_estado_mascota = em.id_estado_mascota
  JOIN refugios r ON m.id_refugio = r.id_refugio
  LEFT JOIN razas rz ON m.id_raza = rz.id_raza
`;

export const USUARIO_SELECT = `
  SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.direccion,
    u.experiencia_mascotas, u.avatar, u.id_rol, u.id_tipo_vivienda, u.id_refugio,
    u.google_id, u.auth_provider, u.activo,
    ro.nombre_rol AS rol, tv.tipo AS tipo_vivienda
  FROM usuarios u
  JOIN roles ro ON u.id_rol = ro.id_rol
  LEFT JOIN tipos_vivienda tv ON u.id_tipo_vivienda = tv.id_tipo_vivienda
`;

export async function getCatalogId(table, codigoColumn, codigo) {
  const map = {
    tipo_mascota: { table: 'tipos_mascota', pk: 'id_tipo_mascota' },
    estado_mascota: { table: 'estados_mascota', pk: 'id_estado_mascota' },
    estado_solicitud: { table: 'estados_solicitud_adopcion', pk: 'id_estado_solicitud' },
    tipo_donacion: { table: 'tipos_donacion', pk: 'id_tipo_donacion' },
    metodo_pago: { table: 'metodos_pago', pk: 'id_metodo_pago' },
    tipo_vivienda: { table: 'tipos_vivienda', pk: 'id_tipo_vivienda' },
    rol: { table: 'roles', pk: 'id_rol', col: 'nombre_rol' },
  };

  const cfg = map[table];
  const col = cfg.col || 'codigo';
  const [rows] = await pool.query(
    `SELECT ${cfg.pk} AS id FROM ${cfg.table} WHERE ${col} = ? LIMIT 1`,
    [codigo]
  );
  return rows[0]?.id;
}

export async function getDefaultRefugioId() {
  const [rows] = await pool.query('SELECT id_refugio FROM refugios WHERE activo = 1 ORDER BY id_refugio LIMIT 1');
  return rows[0]?.id_refugio || 1;
}

export async function getRefugioBySlug(slug) {
  const [rows] = await pool.query(
    `SELECT id_refugio, nombre, slug, direccion, descripcion, telefono, email, ciudad, latitud, longitud, activo
     FROM refugios WHERE slug = ? AND activo = 1 LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

export function resolveRefugioId(req, fallbackToDefault = true) {
  if (req.refugioId) return req.refugioId;
  return fallbackToDefault ? null : null;
}
