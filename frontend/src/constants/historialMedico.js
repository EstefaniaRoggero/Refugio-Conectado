export const HISTORIAL_TIPO_OPTIONS = [
  { value: 'vacuna', label: 'Vacuna' },
  { value: 'desparasitacion', label: 'Desparasitación' },
  { value: 'esterilizacion', label: 'Esterilización' },
  { value: 'cirugia', label: 'Cirugía' },
  { value: 'consulta', label: 'Consulta' },
  { value: 'tratamiento', label: 'Tratamiento' },
  { value: 'otro', label: 'Otro' },
];

export const historialTipoLabel = Object.fromEntries(
  HISTORIAL_TIPO_OPTIONS.map((o) => [o.value, o.label])
);

export const EMPTY_HISTORIAL_FORM = {
  tipo: 'vacuna',
  procedimiento: '',
  descripcion: '',
  fecha: new Date().toISOString().slice(0, 10),
  veterinario: '',
  proxima_dosis: '',
  lote: '',
};

export function mapHistorialToForm(h) {
  return {
    tipo: h.tipo || 'vacuna',
    procedimiento: h.procedimiento || '',
    descripcion: h.descripcion || '',
    fecha: h.fecha ? h.fecha.slice(0, 10) : '',
    veterinario: h.veterinario || '',
    proxima_dosis: h.proxima_dosis ? h.proxima_dosis.slice(0, 10) : '',
    lote: h.lote || '',
  };
}
