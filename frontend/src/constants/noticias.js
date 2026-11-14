export const NOTICIA_TIPO_OPTIONS = [
  { value: 'vacunacion', label: 'Vacunación' },
  { value: 'castracion', label: 'Castración' },
  { value: 'campana', label: 'Campaña' },
  { value: 'evento', label: 'Evento' },
  { value: 'novedad', label: 'Novedad' },
];

export const NOTICIA_TIPO_LABEL = Object.fromEntries(NOTICIA_TIPO_OPTIONS.map((o) => [o.value, o.label]));

export const NOTICIA_TIPO_COLOR = {
  vacunacion: 'bg-sky-100 text-sky-700',
  castracion: 'bg-violet-100 text-violet-700',
  campana: 'bg-amber-100 text-amber-800',
  evento: 'bg-emerald-100 text-emerald-700',
  novedad: 'bg-cream-200 text-brown-dark',
};
