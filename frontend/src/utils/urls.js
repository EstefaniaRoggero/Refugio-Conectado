/** URL pública de la ficha de una mascota (para QR y compartir). */
export function getMascotaPublicUrl(slug, mascotaId) {
  const base = (import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : ''))
    .replace(/\/$/, '');
  return `${base}/${slug}/mascotas/${mascotaId}`;
}
