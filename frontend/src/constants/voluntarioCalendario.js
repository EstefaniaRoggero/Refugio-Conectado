export const DIAS_SEMANA = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 7, label: 'Domingo', short: 'Dom' },
];

export const diaSemanaLabel = Object.fromEntries(DIAS_SEMANA.map((d) => [d.value, d.label]));

export const EMPTY_TURNO_FORM = {
  dia_semana: 6,
  hora_inicio: '09:00',
  hora_fin: '13:00',
  notas: '',
  id_voluntario: '',
};

export function formatTurnoHorario(inicio, fin) {
  return `${inicio} – ${fin}`;
}

export function agruparTurnosPorDia(turnos) {
  const map = Object.fromEntries(DIAS_SEMANA.map((d) => [d.value, []]));
  for (const t of turnos || []) {
    if (map[t.dia_semana]) map[t.dia_semana].push(t);
  }
  for (const dia of DIAS_SEMANA) {
    map[dia.value].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }
  return map;
}

export function contarVoluntariosUnicos(turnos) {
  return new Set((turnos || []).map((t) => t.id_voluntario)).size;
}

export function contarHorasCubiertas(turnos) {
  let total = 0;
  for (const t of turnos || []) {
    const [hi, mi] = t.hora_inicio.split(':').map(Number);
    const [hf, mf] = t.hora_fin.split(':').map(Number);
    total += (hf * 60 + mf) - (hi * 60 + mi);
  }
  return Math.round(total / 60 * 10) / 10;
}
