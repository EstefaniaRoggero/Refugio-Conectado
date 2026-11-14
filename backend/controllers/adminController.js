import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';
import { getUrgencyAlerts } from '../services/urgencyService.js';

const refugioFilter = (req, alias = 'm') =>
  req.refugioId ? ` AND ${alias}.id_refugio = ${pool.escape(req.refugioId)}` : '';

export const getDashboard = asyncHandler(async (req, res) => {
  const rf = refugioFilter(req);
  const rfDon = req.refugioId ? ` AND id_refugio = ${pool.escape(req.refugioId)}` : '';
  const rfVol = req.refugioId ? ` AND id_refugio = ${pool.escape(req.refugioId)}` : '';
  const rfMsg = req.refugioId ? ` AND id_refugio = ${pool.escape(req.refugioId)}` : '';

  const [[mascotas]] = await pool.query(`SELECT COUNT(*) as total FROM mascotas m WHERE 1=1${rf}`);
  const [[disponibles]] = await pool.query(
    `SELECT COUNT(*) as total FROM mascotas m
     JOIN estados_mascota em ON m.id_estado_mascota = em.id_estado_mascota
     WHERE em.codigo = 'disponible'${rf}`
  );
  const [[adopciones]] = await pool.query(
    `SELECT COUNT(*) as total FROM solicitudes_adopcion s
     JOIN estados_solicitud_adopcion esa ON s.id_estado_solicitud = esa.id_estado_solicitud
     JOIN mascotas m ON s.id_mascota = m.id
     WHERE esa.codigo = 'aprobada'${rf}`
  );
  const [[pendientes]] = await pool.query(
    `SELECT COUNT(*) as total FROM solicitudes_adopcion s
     JOIN estados_solicitud_adopcion esa ON s.id_estado_solicitud = esa.id_estado_solicitud
     JOIN mascotas m ON s.id_mascota = m.id
     WHERE esa.codigo = 'pendiente'${rf}`
  );
  const [[usuarios]] = await pool.query(
    `SELECT COUNT(DISTINCT u.id) as total FROM usuarios u
     JOIN solicitudes_adopcion s ON s.id_usuario = u.id
     JOIN mascotas m ON s.id_mascota = m.id
     WHERE 1=1${rf}`
  );
  const [[voluntarios]] = await pool.query(
    `SELECT COUNT(*) as total FROM voluntarios WHERE estado = 'aprobado'${rfVol}`
  );
  const [[donaciones]] = await pool.query(
    `SELECT COALESCE(SUM(monto),0) as total, COUNT(*) as cantidad FROM donaciones WHERE estado = 'completada'${rfDon}`
  );
  const [[mensajes]] = await pool.query(`SELECT COUNT(*) as total FROM mensajes WHERE leido = 0${rfMsg}`);

  const [adopcionesPorMes] = await pool.query(`
    SELECT DATE_FORMAT(s.created_at, '%Y-%m') as mes, COUNT(*) as cantidad
    FROM solicitudes_adopcion s
    JOIN estados_solicitud_adopcion esa ON s.id_estado_solicitud = esa.id_estado_solicitud
    JOIN mascotas m ON s.id_mascota = m.id
    WHERE esa.codigo = 'aprobada' AND s.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)${rf}
    GROUP BY mes ORDER BY mes`);

  const [donacionesPorMes] = await pool.query(`
    SELECT DATE_FORMAT(created_at, '%Y-%m') as mes, SUM(monto) as total
    FROM donaciones WHERE estado = 'completada' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)${rfDon}
    GROUP BY mes ORDER BY mes`);

  const [mascotasPorTipo] = await pool.query(
    `SELECT tm.tipo, COUNT(*) as cantidad FROM mascotas m
     JOIN tipos_mascota tm ON m.id_tipo_mascota = tm.id_tipo_mascota
     WHERE 1=1${rf} GROUP BY tm.tipo`
  );

  const [recientesAdopciones] = await pool.query(`
    SELECT s.*, esa.codigo AS estado, m.nombre as mascota_nombre, u.nombre as usuario_nombre
    FROM solicitudes_adopcion s
    JOIN estados_solicitud_adopcion esa ON s.id_estado_solicitud = esa.id_estado_solicitud
    JOIN mascotas m ON s.id_mascota = m.id
    JOIN usuarios u ON s.id_usuario = u.id
    WHERE 1=1${rf}
    ORDER BY s.created_at DESC LIMIT 5`);

  const urgencia = await getUrgencyAlerts(req.refugioId);

  success(res, {
    metricas: {
      totalMascotas: mascotas.total,
      mascotasDisponibles: disponibles.total,
      adopcionesCompletadas: adopciones.total,
      solicitudesPendientes: pendientes.total,
      totalUsuarios: usuarios.total,
      voluntariosActivos: voluntarios.total,
      totalDonaciones: parseFloat(donaciones.total),
      cantidadDonaciones: donaciones.cantidad,
      mensajesSinLeer: mensajes.total,
      refugiosActivos: 1,
    },
    graficos: { adopcionesPorMes, donacionesPorMes, mascotasPorTipo },
    recientesAdopciones,
    urgencia,
  });
});

export const getUsuarios = asyncHandler(async (req, res) => {
  const [usuarios] = await pool.query(
    `SELECT DISTINCT u.id, u.nombre, u.apellido, u.email, ro.nombre_rol AS rol, u.telefono, u.created_at
     FROM usuarios u
     JOIN roles ro ON u.id_rol = ro.id_rol
     WHERE ro.nombre_rol = 'usuario' AND (
       EXISTS (SELECT 1 FROM solicitudes_adopcion s JOIN mascotas m ON m.id=s.id_mascota WHERE s.id_usuario=u.id AND m.id_refugio=?)
       OR EXISTS (SELECT 1 FROM donaciones d WHERE d.id_usuario=u.id AND d.id_refugio=?)
       OR EXISTS (SELECT 1 FROM voluntarios v WHERE v.id_usuario=u.id AND v.id_refugio=?)
       OR EXISTS (SELECT 1 FROM mensajes me WHERE me.usuario_id=u.id AND me.id_refugio=?)
     ) ORDER BY u.created_at DESC`,
    [req.refugioId, req.refugioId, req.refugioId, req.refugioId]
  );
  success(res, { usuarios });
});

export const updateUsuario = asyncHandler(async (req, res) => {
  error(res, 'Los roles solo pueden administrarse desde el backoffice global', 403);
});

export const deleteUsuario = asyncHandler(async (req, res) => {
  error(res, 'Los usuarios globales no pueden eliminarse desde un refugio', 403);
});
