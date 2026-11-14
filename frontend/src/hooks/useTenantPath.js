import { useParams } from 'react-router-dom';
import useTenantStore from '../context/tenantStore';

/** Genera rutas con el slug del refugio actual: tenantPath('mascotas') → /villa-del-rosario/mascotas */
export default function useTenantPath() {
  const { slug: paramSlug } = useParams();
  const storeSlug = useTenantStore((s) => s.slug);
  const slug = paramSlug || storeSlug;

  return (path = '') => {
    if (!slug) return path.startsWith('/') ? path : `/${path}`;
    const base = `/${slug}`;
    if (!path) return base;
    return `${base}/${path.replace(/^\//, '')}`;
  };
}
