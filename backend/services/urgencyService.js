import pool from '../config/database.js';

const DIAS_DIFUSION = 60;
const DIAS_ALERTA = 90;
const DIAS_CRITICO = 180;
const DIAS_VACUNA_AVISO = 15;

function formatFecha(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function pushAlert(alerts, mascota, alert) {
  alerts.push({
    id_mascota: mascota.id,
    nombre: mascota.nombre,
    imagen: mascota.imagen,
    estado: mascota.estado,
    ...alert,
  });
}

export async function getUrgencyAlerts(idRefugio) {
  const refugioClause = idRefugio ? 'AND m.id_refugio = ?' : '';
  const params = idRefugio ? [idRefugio] : [];

  const [mascotas] = await pool.query(
    `SELECT m.id, m.nombre, m.imagen, m.destacada, m.fecha_ingreso, m.created_at,
            em.codigo AS estado,
            DATEDIFF(CURDATE(), COALESCE(m.fecha_ingreso, DATE(m.created_at))) AS dias_refugio,
            EXISTS(
              SELECT 1 FROM historial_medico_mascota h
              WHERE h.id_mascota = m.id AND h.tipo = 'esterilizacion'
            ) AS esterilizado,
            (
              SELECT MIN(h.proxima_dosis) FROM historial_medico_mascota h
              WHERE h.id_mascota = m.id AND h.proxima_dosis IS NOT NULL AND h.proxima_dosis < CURDATE()
            ) AS dosis_vencida,
            (
              SELECT MIN(h.proxima_dosis) FROM historial_medico_mascota h
              WHERE h.id_mascota = m.id
                AND h.proxima_dosis IS NOT NULL
                AND h.proxima_dosis >= CURDATE()
                AND h.proxima_dosis <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
            ) AS proxima_dosis_pronto
     FROM mascotas m
     JOIN estados_mascota em ON m.id_estado_mascota = em.id_estado_mascota
     WHERE em.codigo IN ('disponible', 'en_proceso', 'reservado') ${refugioClause}
     ORDER BY dias_refugio DESC`,
    [DIAS_VACUNA_AVISO, ...params]
  );

  const alerts = [];

  for (const m of mascotas) {
    const dias = Number(m.dias_refugio) || 0;

    if (dias >= DIAS_CRITICO) {
      pushAlert(alerts, m, {
        tipo: 'dias_sin_adopcion',
        severidad: 'critica',
        mensaje: `${m.nombre} lleva ${dias} días sin adopción. Caso prioritario.`,
        dias,
      });
    } else if (dias >= DIAS_ALERTA) {
      pushAlert(alerts, m, {
        tipo: 'dias_sin_adopcion',
        severidad: 'alta',
        mensaje: `${m.nombre} lleva ${dias} días en el refugio. Conviene impulsar su difusión.`,
        dias,
      });
    } else if (!m.destacada && dias >= DIAS_DIFUSION) {
      pushAlert(alerts, m, {
        tipo: 'difusion',
        severidad: 'media',
        mensaje: `${m.nombre} lleva ${dias} días disponible. Considerá marcarla como destacada.`,
        dias,
      });
    }

    if (!m.esterilizado && m.estado === 'disponible') {
      pushAlert(alerts, m, {
        tipo: 'esterilizacion',
        severidad: 'alta',
        mensaje: `${m.nombre} no tiene castración/esterilización registrada.`,
      });
    }

    if (m.dosis_vencida) {
      pushAlert(alerts, m, {
        tipo: 'vacuna',
        severidad: 'alta',
        mensaje: `${m.nombre} tiene vacuna o control vencido desde el ${formatFecha(m.dosis_vencida)}.`,
        fecha: m.dosis_vencida,
      });
    } else if (m.proxima_dosis_pronto) {
      const diasHasta = Math.ceil(
        (new Date(m.proxima_dosis_pronto) - new Date()) / (1000 * 60 * 60 * 24)
      );
      pushAlert(alerts, m, {
        tipo: 'vacuna',
        severidad: 'media',
        mensaje: `${m.nombre} necesita refuerzo o control en ${diasHasta} día(s).`,
        fecha: m.proxima_dosis_pronto,
        dias: diasHasta,
      });
    }
  }

  const order = { critica: 0, alta: 1, media: 2 };
  alerts.sort((a, b) => order[a.severidad] - order[b.severidad]);

  const resumen = {
    total: alerts.length,
    criticas: alerts.filter((a) => a.severidad === 'critica').length,
    altas: alerts.filter((a) => a.severidad === 'alta').length,
    medias: alerts.filter((a) => a.severidad === 'media').length,
  };

  return { alertas: alerts, resumen };
}
