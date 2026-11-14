import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import { getCatalogId, getDefaultRefugioId } from '../utils/lookups.js';

const DONACION_SELECT = `
  SELECT d.*, td.codigo AS tipo, td.tipo_de_donacion, mp.codigo AS metodo_pago,
    r.nombre AS refugio_nombre
  FROM donaciones d
  LEFT JOIN tipos_donacion td ON d.id_tipo_donacion = td.id_tipo_donacion
  LEFT JOIN metodos_pago mp ON d.id_metodo_pago = mp.id_metodo_pago
  LEFT JOIN refugios r ON d.id_refugio = r.id_refugio
`;

export const crearDonacion = asyncHandler(async (req, res) => {
  const { monto, metodo_pago, tipo, nombre_donante, email_donante, descripcion, id_refugio } = req.body;

  const idTipo = await getCatalogId('tipo_donacion', 'codigo', tipo || 'unica');
  const idMetodo = await getCatalogId('metodo_pago', 'codigo', metodo_pago || 'mercadopago');
  const idRefugio = req.refugioId || id_refugio || await getDefaultRefugioId();

  const [result] = await pool.query(
    `INSERT INTO donaciones (id_usuario, id_refugio, id_tipo_donacion, id_metodo_pago, nombre_donante, email_donante, descripcion, monto, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completada')`,
    [
      req.user?.id || null,
      idRefugio,
      idTipo,
      idMetodo,
      nombre_donante || (req.user ? `${req.user.nombre} ${req.user.apellido}` : 'Anónimo'),
      email_donante || req.user?.email || null,
      descripcion || null,
      monto,
    ]
  );

  const [donaciones] = await pool.query(`${DONACION_SELECT} WHERE d.id = ?`, [result.insertId]);
  success(res, { donacion: donaciones[0] }, '¡Gracias por tu donación!', 201);
});

export const getMisDonaciones = asyncHandler(async (req, res) => {
  const [donaciones] = await pool.query(
    `${DONACION_SELECT} WHERE d.id_usuario = ? ORDER BY d.created_at DESC`,
    [req.user.id]
  );
  success(res, { donaciones });
});

export const getAllDonaciones = asyncHandler(async (req, res) => {
  const rf = req.refugioId ? ' WHERE d.id_refugio = ?' : '';
  const params = req.refugioId ? [req.refugioId] : [];

  const [donaciones] = await pool.query(
    `${DONACION_SELECT}
     LEFT JOIN usuarios u ON d.id_usuario = u.id
     ${rf}
     ORDER BY d.created_at DESC LIMIT 100`,
    params
  );

  const [totales] = await pool.query(
    `SELECT COALESCE(SUM(monto), 0) as total, COUNT(*) as cantidad FROM donaciones WHERE estado = 'completada'${req.refugioId ? ' AND id_refugio = ?' : ''}`,
    req.refugioId ? [req.refugioId] : []
  );

  const [mensuales] = await pool.query(
    `SELECT COALESCE(SUM(d.monto), 0) as total FROM donaciones d
     JOIN tipos_donacion td ON d.id_tipo_donacion = td.id_tipo_donacion
     WHERE td.codigo = 'mensual' AND d.estado = 'completada'${req.refugioId ? ' AND d.id_refugio = ?' : ''}`,
    req.refugioId ? [req.refugioId] : []
  );

  success(res, {
    donaciones,
    estadisticas: {
      totalRecaudado: parseFloat(totales[0].total),
      totalDonaciones: totales[0].cantidad,
      totalMensual: parseFloat(mensuales[0].total),
    },
  });
});

export const getDonacionesPublicas = asyncHandler(async (req, res) => {
  const rf = req.refugioId ? ' AND d.id_refugio = ?' : '';
  const params = req.refugioId ? [req.refugioId] : [];

  const [recientes] = await pool.query(
    `SELECT d.nombre_donante, d.monto, td.codigo AS tipo, d.created_at
     FROM donaciones d
     LEFT JOIN tipos_donacion td ON d.id_tipo_donacion = td.id_tipo_donacion
     WHERE d.estado = 'completada'${rf} ORDER BY d.created_at DESC LIMIT 10`,
    params
  );

  const [total] = await pool.query(
    `SELECT COALESCE(SUM(monto), 0) as total FROM donaciones WHERE estado = 'completada'${req.refugioId ? ' AND id_refugio = ?' : ''}`,
    req.refugioId ? [req.refugioId] : []
  );

  success(res, { recientes, totalRecaudado: parseFloat(total[0].total) });
});
