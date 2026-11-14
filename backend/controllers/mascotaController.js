import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';
import { saveUpload } from '../middlewares/upload.js';
import { MASCOTA_SELECT, getCatalogId, getDefaultRefugioId } from '../utils/lookups.js';

const imagenTexto = (value) =>
  typeof value === 'string' && value.trim() && !value.includes('[object') ? value.trim() : undefined;

const buildFilters = (query, refugioId) => {
  const conditions = ['m.publicada = 1'];
  const params = [];

  if (refugioId) {
    conditions.push('m.id_refugio = ?');
    params.push(refugioId);
  }

  if (query.estado) {
    conditions.push('em.codigo = ?');
    params.push(query.estado);
  } else if (!query.admin) {
    conditions.push("em.codigo IN ('disponible', 'en_proceso', 'reservado')");
  }

  if (query.tamano) { conditions.push('m.tamano = ?'); params.push(query.tamano); }
  if (query.sexo) { conditions.push('m.sexo = ?'); params.push(query.sexo); }
  if (query.energia) { conditions.push('m.nivel_energia = ?'); params.push(query.energia); }
  if (query.tipo) { conditions.push('tm.codigo = ?'); params.push(query.tipo); }
  if (query.compatible_ninos !== undefined) {
    conditions.push('m.compatible_ninos = ?');
    params.push(query.compatible_ninos === 'true' || query.compatible_ninos === '1' ? 1 : 0);
  }
  if (query.compatible_mascotas !== undefined) {
    conditions.push('m.compatible_mascotas = ?');
    params.push(query.compatible_mascotas === 'true' || query.compatible_mascotas === '1' ? 1 : 0);
  }
  if (query.edad_min) { conditions.push('m.edad >= ?'); params.push(query.edad_min); }
  if (query.edad_max) { conditions.push('m.edad <= ?'); params.push(query.edad_max); }
  if (query.destacada) { conditions.push('m.destacada = 1'); }
  if (query.id_raza) { conditions.push('m.id_raza = ?'); params.push(query.id_raza); }
  if (query.busqueda) {
    conditions.push('(m.nombre LIKE ? OR m.descripcion LIKE ? OR m.personalidad LIKE ?)');
    const term = `%${query.busqueda}%`;
    params.push(term, term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
};

export const getMascotas = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));
  const offset = (page - 1) * limit;

  const { where, params } = buildFilters(
    { ...req.query, admin: req.user?.rol === 'admin' && req.query.admin === 'true' },
    req.refugioId
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total FROM mascotas m
     JOIN tipos_mascota tm ON m.id_tipo_mascota = tm.id_tipo_mascota
     JOIN estados_mascota em ON m.id_estado_mascota = em.id_estado_mascota
     ${where}`,
    params
  );
  const total = countRows[0].total;

  const isAdmin = req.user?.rol === 'admin' && req.query.admin === 'true';
  const orderBy = isAdmin
    ? `ORDER BY CASE WHEN em.codigo = 'adoptado' THEN 1 ELSE 0 END ASC,
       COALESCE(m.fecha_ingreso, DATE(m.created_at)) ASC`
    : `ORDER BY m.destacada DESC, COALESCE(m.fecha_ingreso, DATE(m.created_at)) ASC`;

  const selectWithDias = MASCOTA_SELECT.replace(
    'SELECT m.*,',
    `SELECT m.*,
     DATEDIFF(CURDATE(), COALESCE(m.fecha_ingreso, DATE(m.created_at))) AS dias_en_refugio,`
  );

  const [mascotas] = await pool.query(
    `${selectWithDias} ${where} ${orderBy} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  success(res, { mascotas, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getMascotaById = asyncHandler(async (req, res) => {
  const [mascotas] = await pool.query(
    `${MASCOTA_SELECT} WHERE m.id = ?${req.refugioId ? ' AND m.id_refugio = ?' : ''}`,
    req.refugioId ? [req.params.id, req.refugioId] : [req.params.id]
  );
  if (!mascotas.length) return error(res, 'Mascota no encontrada', 404);

  const [imagenes] = await pool.query(
    'SELECT * FROM mascota_imagenes WHERE mascota_id = ? ORDER BY orden',
    [req.params.id]
  );

  let esFavorito = false;
  if (req.user) {
    const [fav] = await pool.query(
      'SELECT id FROM favoritos WHERE usuario_id = ? AND mascota_id = ?',
      [req.user.id, req.params.id]
    );
    esFavorito = fav.length > 0;
  }

  const [historial] = await pool.query(
    'SELECT * FROM historial_medico_mascota WHERE id_mascota = ? ORDER BY fecha DESC',
    [req.params.id]
  );

  success(res, { mascota: mascotas[0], imagenes, historialMedico: historial, esFavorito });
});

export const createMascota = asyncHandler(async (req, res) => {
  const data = req.body;
  const imagen = req.file ? await saveUpload(req.file) : imagenTexto(data.imagen) || null;

  const idTipo = data.id_tipo_mascota || await getCatalogId('tipo_mascota', 'codigo', data.tipo || 'perro');
  const idEstado = data.id_estado_mascota || await getCatalogId('estado_mascota', 'codigo', data.estado || 'disponible');
  const idRefugio = req.refugioId || data.id_refugio || await getDefaultRefugioId();

  const [result] = await pool.query(
    `INSERT INTO mascotas (nombre, id_tipo_mascota, id_raza, id_estado_mascota, id_refugio, descripcion, historia, edad, edad_unidad,
      tamano, nivel_energia, sexo, imagen, vacunas, estado_medico, personalidad, comportamiento,
      compatible_ninos, compatible_mascotas, destacada, publicada)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      data.nombre, idTipo, data.id_raza || null, idEstado, idRefugio, data.descripcion, data.historia, data.edad, data.edad_unidad || 'años',
      data.tamano, data.energia || data.nivel_energia || 'media', data.sexo, imagen,
      data.vacunas, data.estado_medico, data.personalidad, data.comportamiento,
      data.compatible_ninos ?? 1, data.compatible_mascotas ?? 1, data.destacada ?? 0, data.publicada ?? 1,
    ]
  );

  const [mascotas] = await pool.query(`${MASCOTA_SELECT} WHERE m.id = ?`, [result.insertId]);
  success(res, { mascota: mascotas[0] }, 'Mascota creada', 201);
});

export const updateMascota = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const imagen = req.file ? await saveUpload(req.file) : imagenTexto(data.imagen);

  const fields = [];
  const values = [];

  if (data.nombre !== undefined) { fields.push('nombre = ?'); values.push(data.nombre); }
  if (data.tipo || data.id_tipo_mascota) {
    const idTipo = data.id_tipo_mascota || await getCatalogId('tipo_mascota', 'codigo', data.tipo);
    fields.push('id_tipo_mascota = ?'); values.push(idTipo);
  }
  if (data.estado || data.id_estado_mascota) {
    const idEstado = data.id_estado_mascota || await getCatalogId('estado_mascota', 'codigo', data.estado);
    fields.push('id_estado_mascota = ?'); values.push(idEstado);
  }
  if (data.id_raza !== undefined) { fields.push('id_raza = ?'); values.push(data.id_raza || null); }
  ['descripcion', 'historia', 'edad', 'edad_unidad', 'tamano', 'sexo', 'vacunas', 'estado_medico', 'personalidad', 'comportamiento', 'compatible_ninos', 'compatible_mascotas', 'destacada', 'publicada'].forEach((key) => {
    if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
  });
  if (data.energia || data.nivel_energia) {
    fields.push('nivel_energia = ?'); values.push(data.energia || data.nivel_energia);
  }
  if (imagen) { fields.push('imagen = ?'); values.push(imagen); }

  if (!fields.length) return error(res, 'No hay datos para actualizar', 400);

  values.push(id);
  let result;
  if (req.refugioId) {
    [result] = await pool.query(`UPDATE mascotas SET ${fields.join(', ')} WHERE id = ? AND id_refugio = ?`, [...values, req.refugioId]);
  } else {
    [result] = await pool.query(`UPDATE mascotas SET ${fields.join(', ')} WHERE id = ?`, values);
  }
  if (!result.affectedRows) return error(res, 'Mascota no encontrada', 404);

  const [mascotas] = await pool.query(
    `${MASCOTA_SELECT} WHERE m.id = ?${req.refugioId ? ' AND m.id_refugio=?' : ''}`,
    req.refugioId ? [id, req.refugioId] : [id]
  );
  success(res, { mascota: mascotas[0] }, 'Mascota actualizada');
});

export const deleteMascota = asyncHandler(async (req, res) => {
  const params = [req.params.id];
  let sql = 'DELETE FROM mascotas WHERE id = ?';
  if (req.refugioId) {
    sql += ' AND id_refugio = ?';
    params.push(req.refugioId);
  }
  const [result] = await pool.query(sql, params);
  if (!result.affectedRows) return error(res, 'Mascota no encontrada', 404);
  success(res, null, 'Mascota eliminada');
});

export const recomendarMascotas = asyncHandler(async (req, res) => {
  const { recomendarConIA, isAIConfigured } = await import('../services/adoptionAgentService.js');
  const { buscarCandidatos } = await import('../services/petMatcherService.js');

  if (isAIConfigured()) {
    const resultado = await recomendarConIA(req.body, req.refugioId);
    return success(res, {
      recomendaciones: resultado.recomendaciones,
      criterios: resultado.criterios,
      resumen_perfil: resultado.resumen_perfil,
      consejo_general: resultado.consejo_general,
      powered_by: 'ai',
    });
  }

  const { criterios, candidatos } = await buscarCandidatos(req.body, 6, req.refugioId);
  success(res, {
    recomendaciones: candidatos,
    criterios,
    powered_by: 'rules',
    aviso: 'Configura OPENAI_API_KEY para recomendaciones con inteligencia artificial.',
  });
});
