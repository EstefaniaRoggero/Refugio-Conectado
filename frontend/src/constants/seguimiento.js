export const FRECUENCIA_OPTIONS = [
  { value: 'semanal', label: 'Semanal (cada 7 días)' },
  { value: 'quincenal', label: 'Quincenal (cada 15 días)' },
  { value: 'mensual', label: 'Mensual (cada 30 días)' },
];

export const frecuenciaLabel = {
  semanal: 'Semanal',
  quincenal: 'Quincenal',
  mensual: 'Mensual',
};

export const estadoReporteSeguimientoLabel = {
  al_dia: 'Al día',
  pendiente: 'Pendiente de enviar',
  inactivo: 'Inactivo',
};

export const estadoReporteSeguimientoColor = {
  al_dia: 'bg-green-100 text-green-700',
  pendiente: 'bg-amber-100 text-amber-800',
  inactivo: 'bg-cream-200 text-brown-soft',
};

export const estadoReporteItemLabel = {
  enviado: 'Enviado',
  revisado: 'Revisado',
};

export const estadoReporteItemColor = {
  enviado: 'bg-orange-pastel/30 text-terracotta-dark',
  revisado: 'bg-green-100 text-green-700',
};
