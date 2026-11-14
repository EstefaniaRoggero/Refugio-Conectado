import { Navigate, useLocation, useParams } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import useTenantStore from '../context/tenantStore';

export function ProtectedRoute({ children, roles, loginPath }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const { slug: paramSlug } = useParams();
  const storeSlug = useTenantStore((s) => s.slug);
  const slug = paramSlug || storeSlug;

  if (!isAuthenticated) {
    return <Navigate to={loginPath || (slug ? `/${slug}/login` : '/')} state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.rol)) {
    return <Navigate to={slug ? `/${slug}` : '/'} replace />;
  }

  return children;
}
