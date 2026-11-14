export const AVISO_TIPO_LABEL = {
  perdido: 'Se perdió',
  encontrado: 'Encontrado',
};

export const AVISO_TIPO_COLOR = {
  perdido: 'bg-red-100 text-red-700',
  encontrado: 'bg-emerald-100 text-emerald-700',
};

export const AVISO_ESPECIE_OPTIONS = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'otro', label: 'Otro' },
];

export const AVISO_ESTADO_LABEL = {
  pendiente: 'Pendiente de revisión',
  publicado: 'Publicado',
  rechazado: 'Rechazado',
  resuelto: 'Resuelto',
};

export const AVISO_ESTADO_COLOR = {
  pendiente: 'bg-amber-100 text-amber-800',
  publicado: 'bg-emerald-100 text-emerald-700',
  rechazado: 'bg-cream-200 text-brown-soft',
  resuelto: 'bg-sky-100 text-sky-700',
};

export const MAX_FOTOS_AVISO = 3;

/** "2026-09-30" → "30/09/2026" sin pasar por Date (evita corrimientos de zona horaria) */
export function formatFechaAviso(fecha) {
  if (!fecha || typeof fecha !== 'string') return '—';
  const [y, m, d] = fecha.slice(0, 10).split('-');
  return d && m && y ? `${d}/${m}/${y}` : fecha;
}

/** Link wa.me para celulares argentinos (549 + código de área + número) */
export function buildWhatsAppLink(telefono, texto) {
  let n = String(telefono || '').replace(/\D/g, '');
  if (!n) return null;
  if (n.startsWith('0')) n = n.slice(1);
  if (n.length === 10) n = `549${n}`;
  else if (!n.startsWith('54')) n = `54${n}`;
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
}
