import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';
import { saveUpload } from '../middlewares/upload.js';

const TIPOS = ['vacunacion', 'castracion', 'campana', 'evento', 'novedad'];

const texto = (value, max) => {
  const t = typeof value === 'string' ? value.trim() : '';
  return t ? t.slice(0, max) : '';
};

const fechaValida = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');

const CAMPOS_FECHA = `DATE_FORMAT(fecha_evento, '%Y-%m-%d') AS fecha_evento,
                      DATE_FORMAT(vigente_hasta, '%Y-%m-%d') AS vigente_hasta`;

const VIGENTE = '(vigente_hasta IS NULL OR vigente_hasta >= CURDATE())';

function leerNoticia(body) {
  const datos = {
    tipo: texto(body.tipo, 20),
    titulo: texto(body.titulo, 150),
    contenido: texto(body.contenido, 5000),
    fecha_evento: texto(body.fecha_evento, 10) || null,
    horario: texto(body.horario, 60) || null,
    lugar: texto(body.lugar, 150) || null,
    vigente_hasta: texto(body.vigente_hasta, 10) || null,
    destacada: body.destacada === 'true' || body.destacada === true ? 1 : 0,
    publicada: body.publicada === 'false' || body.publicada === false ? 0 : 1,
  };

  if (!TIPOS.includes(datos.tipo)) return { mensaje: 'Elegí el tipo de novedad' };
  if (!datos.titulo || !datos.contenido) return { mensaje: 'Completá el título y el contenido' };
  if (datos.fecha_evento && !fechaValida(datos.fecha_evento)) return { mensaje: 'La fecha del evento no es válida' };
  if (datos.vigente_hasta && !fechaValida(datos.vigente_hasta)) return { mensaje: 'La fecha de vencimiento no es válida' };
  return { datos };
}

export const getNoticiasPublicas = asyncHandler(async (req, res) => {
  const params = [req.refugioId];
  let sql = `SELECT id, tipo, titulo, contenido, imagen, horario, lugar, destacada, created_at, ${CAMPOS_FECHA}
             FROM noticias
             WHERE id_refugio = ? AND publicada = 1 AND ${VIGENTE}`;
  if (TIPOS.includes(req.query.tipo)) {
    sql += ' AND tipo = ?';
    params.push(req.query.tipo);
  }
  const limite = Math.min(Math.max(parseInt(req.query.limit, 10) || 60, 1), 60);
  sql += ' ORDER BY destacada DESC, created_at DESC LIMIT ?';
  params.push(limite);

  const [noticias] = await pool.query(sql, params);
  success(res, { noticias });
});

export const getNoticiasAdmin = asyncHandler(async (req, res) => {
  const [noticias] = await pool.query(
    `SELECT *, ${CAMPOS_FECHA},
            (vigente_hasta IS NOT NULL AND vigente_hasta < CURDATE()) AS vencida
     FROM noticias WHERE id_refugio = ?
     ORDER BY created_at DESC`,
    [req.refugioId]
  );
  success(res, { noticias });
});

export const crearNoticia = asyncHandler(async (req, res) => {
  const { datos, mensaje } = leerNoticia(req.body);
  if (mensaje) return error(res, mensaje, 400);

  const imagen = req.file ? await saveUpload(req.file) : null;
  const [result] = await pool.query(
    `INSERT INTO noticias
      (id_refugio, id_usuario, tipo, titulo, contenido, imagen, fecha_evento, horario, lugar,
       vigente_hasta, destacada, publicada)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      req.refugioId, req.user.id, datos.tipo, datos.titulo, datos.contenido, imagen,
      datos.fecha_evento, datos.horario, datos.lugar, datos.vigente_hasta, datos.destacada, datos.publicada,
    ]
  );
  success(res, { id: result.insertId }, 'Novedad creada', 201);
});

export const actualizarNoticia = asyncHandler(async (req, res) => {
  const [[noticia]] = await pool.query(
    'SELECT id, imagen FROM noticias WHERE id = ? AND id_refugio = ?',
    [req.params.id, req.refugioId]
  );
  if (!noticia) return error(res, 'Novedad no encontrada', 404);

  const { datos, mensaje } = leerNoticia(req.body);
  if (mensaje) return error(res, mensaje, 400);

  let imagen = noticia.imagen;
  if (req.file) imagen = await saveUpload(req.file);
  else if (req.body.quitar_imagen === 'true') imagen = null;

  await pool.query(
    `UPDATE noticias
     SET tipo = ?, titulo = ?, contenido = ?, imagen = ?, fecha_evento = ?, horario = ?, lugar = ?,
         vigente_hasta = ?, destacada = ?, publicada = ?
     WHERE id = ?`,
    [
      datos.tipo, datos.titulo, datos.contenido, imagen, datos.fecha_evento, datos.horario, datos.lugar,
      datos.vigente_hasta, datos.destacada, datos.publicada, noticia.id,
    ]
  );
  success(res, null, 'Novedad actualizada');
});

export const eliminarNoticia = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM noticias WHERE id = ? AND id_refugio = ?',
    [req.params.id, req.refugioId]
  );
  if (!result.affectedRows) return error(res, 'Novedad no encontrada', 404);
  success(res, null, 'Novedad eliminada');
});
