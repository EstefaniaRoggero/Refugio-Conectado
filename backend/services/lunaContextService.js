import pool from '../config/database.js';
import { SEGUIMIENTO_SELECT } from './seguimientoService.js';

const DIA_SEMANA_LABEL = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves',
  5: 'Viernes', 6: 'Sábado', 7: 'Domingo',
};

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}

export async function buildLunaUserContext(userId, idRefugio) {
  const ctx = {
    nombre: null,
    rol: null,
    adopciones: [],
    seguimientos: [],
    vacunas_proximas: [],
    voluntariado: null,
    turnos_voluntario: [],
    donaciones: { total: 0, monto: 0 },
  };

  const [users] = await pool.query(
    'SELECT nombre, apellido, telefono, ro.nombre_rol AS rol FROM usuarios u JOIN roles ro ON u.id_rol = ro.id_rol WHERE u.id = ?',
    [userId]
  );
  if (!users.length) return ctx;

  const u = users[0];
  ctx.nombre = `${u.nombre} ${u.apellido || ''}`.trim();
  ctx.rol = u.rol;

  const [solicitudes] = await pool.query(
    `SELECT s.id, esa.codigo AS estado, m.nombre AS mascota_nombre
     FROM solicitudes_adopcion s
     JOIN estados_solicitud_adopcion esa ON s.id_estado_solicitud = esa.id_estado_solicitud
     JOIN mascotas m ON s.id_mascota = m.id
     WHERE s.id_usuario = ? AND m.id_refugio = ?
     ORDER BY s.created_at DESC LIMIT 5`,
    [userId, idRefugio]
  );
  ctx.adopciones = solicitudes;

  const [seguimientos] = await pool.query(
    `${SEGUIMIENTO_SELECT}
     WHERE sg.id_usuario = ? AND sg.id_refugio = ? AND sg.estado = 'activo'`,
    [userId, idRefugio]
  );
  ctx.seguimientos = seguimientos.map((s) => ({
    mascota: s.mascota_nombre,
    frecuencia: s.frecuencia_reporte,
    proximo_reporte: formatDate(s.proximo_reporte),
  }));

  if (seguimientos.length) {
    const mascotaIds = seguimientos.map((s) => s.id_mascota);
    const [vacunas] = await pool.query(
      `SELECT m.nombre AS mascota, h.procedimiento, h.proxima_dosis, h.tipo
       FROM historial_medico_mascota h
       JOIN mascotas m ON h.id_mascota = m.id
       WHERE h.id_mascota IN (${mascotaIds.map(() => '?').join(',')})
         AND h.proxima_dosis IS NOT NULL AND h.proxima_dosis >= CURDATE()
       ORDER BY h.proxima_dosis ASC LIMIT 10`,
      mascotaIds
    );
    ctx.vacunas_proximas = vacunas.map((v) => ({
      mascota: v.mascota,
      procedimiento: v.procedimiento,
      tipo: v.tipo,
      fecha: formatDate(v.proxima_dosis),
    }));
  }

  const [vol] = await pool.query(
    'SELECT id, estado, disponibilidad, tarea FROM voluntarios WHERE id_usuario = ? AND id_refugio = ? ORDER BY created_at DESC LIMIT 1',
    [userId, idRefugio]
  );
  if (vol.length) {
    ctx.voluntariado = vol[0];
    if (vol[0].estado === 'aprobado') {
      const [turnos] = await pool.query(
        'SELECT dia_semana, hora_inicio, hora_fin, notas FROM voluntario_turnos WHERE id_voluntario = ? ORDER BY dia_semana',
        [vol[0].id]
      );
      ctx.turnos_voluntario = turnos.map((t) => ({
        dia: DIA_SEMANA_LABEL[t.dia_semana] || t.dia_semana,
        horario: `${String(t.hora_inicio).slice(0, 5)}–${String(t.hora_fin).slice(0, 5)}`,
        notas: t.notas,
      }));
    }
  }

  const [[don]] = await pool.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(monto), 0) AS monto
     FROM donaciones WHERE id_usuario = ? AND id_refugio = ? AND estado = 'completada'`,
    [userId, idRefugio]
  );
  ctx.donaciones = { total: don.total, monto: Number(don.monto) };

  return ctx;
}

export function formatContextForPrompt(ctx) {
  if (!ctx?.nombre) return 'Usuario no identificado (invitado).';

  const lines = [`Usuario: ${ctx.nombre} (${ctx.rol})`];

  if (ctx.adopciones.length) {
    lines.push('Solicitudes de adopción:');
    ctx.adopciones.forEach((s) => lines.push(`- ${s.mascota_nombre}: ${s.estado}`));
  }

  if (ctx.seguimientos.length) {
    lines.push('Seguimiento post-adopción activo:');
    ctx.seguimientos.forEach((s) => {
      lines.push(`- ${s.mascota}: frecuencia ${s.frecuencia}, próximo reporte ${s.proximo_reporte}`);
    });
  }

  if (ctx.vacunas_proximas.length) {
    lines.push('Próximas vacunas/controles de mascotas adoptadas:');
    ctx.vacunas_proximas.forEach((v) => {
      lines.push(`- ${v.mascota}: ${v.procedimiento} (${v.tipo}) el ${v.fecha}`);
    });
  } else if (ctx.seguimientos.length) {
    lines.push('No hay vacunas/controles con fecha próxima registrados en el sistema.');
  }

  if (ctx.voluntariado) {
    lines.push(`Voluntariado: estado ${ctx.voluntariado.estado}, disponibilidad: ${ctx.voluntariado.disponibilidad}`);
    if (ctx.turnos_voluntario.length) {
      lines.push('Turnos en calendario:');
      ctx.turnos_voluntario.forEach((t) => lines.push(`- ${t.dia} ${t.horario}${t.notas ? ` (${t.notas})` : ''}`));
    }
  }

  if (ctx.donaciones.total > 0) {
    lines.push(`Donaciones en este refugio: ${ctx.donaciones.total} por un total de $${ctx.donaciones.monto} COP`);
  }

  return lines.join('\n');
}
