import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';
import { saveUpload } from '../middlewares/upload.js';
import { notificarAdminsRefugio } from '../services/seguimientoService.js';

const DIAS_VIGENCIA = 30;

const TIPOS = ['perdido', 'encontrado'];
const ESPECIES = ['perro', 'gato', 'otro'];
const ESTADOS = ['pendiente', 'publicado', 'rechazado', 'resuelto'];

const texto = (value, max) => {
  const t = typeof value === 'string' ? value.trim() : '';
  return t ? t.slice(0, max) : '';
};

async function adjuntarImagenes(avisos) {
  if (!avisos.length) return avisos;
  const ids = avisos.map((a) => a.id);
  const [imagenes] = await pool.query(
    'SELECT id, id_aviso, url FROM avisos_perdidos_imagenes WHERE id_aviso IN (?) ORDER BY orden',
    [ids]
  );
  return avisos.map((a) => ({
    ...a,
    imagenes: imagenes.filter((img) => img.id_aviso === a.id),
  }));
}

const vencido = (aviso) =>
  aviso.estado === 'publicado'
  && aviso.publicado_at
  && Date.now() - new Date(aviso.publicado_at).getTime() > DIAS_VIGENCIA * 86400000;

export const crearAviso = asyncHandler(async (req, res) => {
  const tipo = texto(req.body.tipo, 20);
  const especie = texto(req.body.especie, 20);
  const descripcion = texto(req.body.descripcion, 2000);
  const zona = texto(req.body.zona, 150);
  const fecha = texto(req.body.fecha_evento, 10);
  const contactoNombre = texto(req.body.contacto_nombre, 100);
  const contactoTelefono = texto(req.body.contacto_telefono, 30);
  const files = req.files || [];

  if (!TIPOS.includes(tipo)) return error(res, 'Indicá si la mascota se perdió o la encontraste', 400);
  if (!ESPECIES.includes(especie)) return error(res, 'Indicá la especie', 400);
  if (!descripcion || !zona || !contactoNombre) {
    return error(res, 'Completá la descripción, la zona y tu nombre', 400);
  }
  if (contactoTelefono.replace(/\D/g, '').length < 8) {
    return error(res, 'Ingresá un teléfono de WhatsApp válido', 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || new Date(fecha) > new Date()) {
    return error(res, 'Ingresá una fecha válida (no puede ser futura)', 400);
  }
  if (!files.length) return error(res, 'Adjuntá al menos una foto de la mascota', 400);

  const resguardado = tipo === 'encontrado' ? (req.body.resguardado === 'true' ? 1 : 0) : null;

  const [result] = await pool.query(
    `INSERT INTO avisos_perdidos
      (id_refugio, id_usuario, tipo, especie, nombre_mascota, descripcion, zona, fecha_evento,
       resguardado, contacto_nombre, contacto_telefono)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      req.refugioId,
      req.user?.id || null,
      tipo,
      especie,
      texto(req.body.nombre_mascota, 80) || null,
      descripcion,
      zona,
      fecha,
      resguardado,
      contactoNombre,
      contactoTelefono,
    ]
  );

  for (let i = 0; i < files.length; i++) {
    const url = await saveUpload(files[i]);
    await pool.query(
      'INSERT INTO avisos_perdidos_imagenes (id_aviso, url, orden) VALUES (?,?,?)',
      [result.insertId, url, i]
    );
  }

  await notificarAdminsRefugio(
    req.refugioId,
    tipo === 'perdido' ? 'Nuevo aviso de mascota perdida' : 'Nuevo aviso de mascota encontrada',
    `${contactoNombre} reportó un${tipo === 'perdido' ? 'a mascota perdida' : 'a mascota encontrada'} en ${zona}. Revisalo para publicarlo.`
  );

  success(res, { id: result.insertId }, 'Aviso recibido. Un administrador lo va a revisar antes de publicarlo.', 201);
});

export const getAvisosPublicos = asyncHandler(async (req, res) => {
  const params = [req.refugioId, DIAS_VIGENCIA];
  let sql = `SELECT id, tipo, especie, nombre_mascota, descripcion, zona,
                    DATE_FORMAT(fecha_evento, '%Y-%m-%d') AS fecha_evento, resguardado,
                    contacto_nombre, contacto_telefono, publicado_at
             FROM avisos_perdidos
             WHERE id_refugio = ? AND estado = 'publicado'
               AND publicado_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`;
  if (TIPOS.includes(req.query.tipo)) {
    sql += ' AND tipo = ?';
    params.push(req.query.tipo);
  }
  sql += ' ORDER BY publicado_at DESC LIMIT 60';

  const [avisos] = await pool.query(sql, params);
  success(res, { avisos: await adjuntarImagenes(avisos) });
});

export const getAvisosAdmin = asyncHandler(async (req, res) => {
  const params = [req.refugioId];
  let sql = `SELECT *, DATE_FORMAT(fecha_evento, '%Y-%m-%d') AS fecha_evento
             FROM avisos_perdidos WHERE id_refugio = ?`;
  if (ESTADOS.includes(req.query.estado)) {
    sql += ' AND estado = ?';
    params.push(req.query.estado);
  }
  sql += ` ORDER BY FIELD(estado, 'pendiente', 'publicado', 'resuelto', 'rechazado'), created_at DESC`;

  const [avisos] = await pool.query(sql, params);
  const conImagenes = await adjuntarImagenes(avisos);
  success(res, { avisos: conImagenes.map((a) => ({ ...a, vencido: vencido(a) })) });
});

export const cambiarEstadoAviso = asyncHandler(async (req, res) => {
  const { estado } = req.body;
  if (!['publicado', 'rechazado', 'resuelto'].includes(estado)) {
    return error(res, 'Estado inválido', 400);
  }

  const [[aviso]] = await pool.query(
    'SELECT id FROM avisos_perdidos WHERE id = ? AND id_refugio = ?',
    [req.params.id, req.refugioId]
  );
  if (!aviso) return error(res, 'Aviso no encontrado', 404);

  if (estado === 'publicado') {
    await pool.query(
      "UPDATE avisos_perdidos SET estado = 'publicado', publicado_at = NOW(), motivo_rechazo = NULL WHERE id = ?",
      [aviso.id]
    );
  } else if (estado === 'rechazado') {
    await pool.query(
      "UPDATE avisos_perdidos SET estado = 'rechazado', motivo_rechazo = ? WHERE id = ?",
      [texto(req.body.motivo_rechazo, 255) || null, aviso.id]
    );
  } else {
    await pool.query("UPDATE avisos_perdidos SET estado = 'resuelto' WHERE id = ?", [aviso.id]);
  }

  const mensajes = {
    publicado: 'Aviso publicado',
    rechazado: 'Aviso rechazado',
    resuelto: 'Aviso marcado como resuelto',
  };
  success(res, null, mensajes[estado]);
});

export const eliminarAviso = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM avisos_perdidos WHERE id = ? AND id_refugio = ?',
    [req.params.id, req.refugioId]
  );
  if (!result.affectedRows) return error(res, 'Aviso no encontrado', 404);
  success(res, null, 'Aviso eliminado');
});
