import { Navigate } from 'react-router-dom';
import useTenantPath from '../../hooks/useTenantPath';

export default function MisDonaciones() {
  const tenantPath = useTenantPath();
  return <Navigate to={tenantPath('donar?vista=historial')} replace />;
}
