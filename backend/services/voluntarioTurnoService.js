export const TURNO_SELECT = `
  SELECT t.*,
    v.estado AS voluntario_estado, v.tarea, v.disponibilidad,
    u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
  FROM voluntario_turnos t
  JOIN voluntarios v ON t.id_voluntario = v.id
  JOIN usuarios u ON v.id_usuario = u.id
`;

export function formatHora(time) {
  if (!time) return '';
  const s = String(time);
  return s.slice(0, 5);
}

export function nombrePublico(nombre, apellido) {
  const n = nombre || '';
  const a = apellido ? `${apellido.charAt(0)}.` : '';
  return `${n} ${a}`.trim();
}

export function validarTurno({ dia_semana, hora_inicio, hora_fin }) {
  const dia = Number(dia_semana);
  if (!Number.isInteger(dia) || dia < 1 || dia > 7) {
    return 'Día de la semana inválido (1=Lunes … 7=Domingo)';
  }
  if (!hora_inicio || !hora_fin) return 'Horario de inicio y fin son obligatorios';
  if (hora_fin <= hora_inicio) return 'La hora de fin debe ser posterior al inicio';
  return null;
}

export function mapTurnoRow(row, { fullNames = false } = {}) {
  return {
    id: row.id,
    id_voluntario: row.id_voluntario,
    id_refugio: row.id_refugio,
    dia_semana: row.dia_semana,
    hora_inicio: formatHora(row.hora_inicio),
    hora_fin: formatHora(row.hora_fin),
    notas: row.notas,
    tarea: row.tarea,
    nombre: fullNames
      ? `${row.usuario_nombre} ${row.usuario_apellido || ''}`.trim()
      : nombrePublico(row.usuario_nombre, row.usuario_apellido),
    created_at: row.created_at,
  };
}
