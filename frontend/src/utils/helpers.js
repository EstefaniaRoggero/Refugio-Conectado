export const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

/** Tiempo humano desde ingreso al refugio (días) */
export function formatTiempoEnRefugio(dias) {
  if (dias == null || dias < 0) return '—';
  if (dias === 0) return 'Hoy';
  if (dias === 1) return '1 día';
  if (dias < 30) return `${dias} días`;
  if (dias < 365) {
    const meses = Math.floor(dias / 30);
    return meses === 1 ? '1 mes' : `${meses} meses`;
  }
  const años = Math.floor(dias / 365);
  const meses = Math.floor((dias % 365) / 30);
  if (meses === 0) return años === 1 ? '1 año' : `${años} años`;
  return `${años} ${años === 1 ? 'año' : 'años'} y ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
}

/** Indica si la mascota lleva bastante tiempo esperando (sin mostrar cifra exacta al público) */
export function esMascotaLargaEspera(dias, umbral = 45) {
  return typeof dias === 'number' && dias >= umbral;
}

export const getImageUrl = (path) => {
  const fallback = 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400';
  if (!path || typeof path !== 'string' || path.includes('[object')) return fallback;
  if (path.startsWith('http')) return path;
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  return `${base}${path}`;
};

export { estadoMascotaLabel, estadoSolicitudLabel, estadoSolicitudColor } from '../constants/labels';
