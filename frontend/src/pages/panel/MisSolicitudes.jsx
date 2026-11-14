import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/ui/Loader';
import useAsyncData from '../../hooks/useAsyncData';
import { getImageUrl, estadoSolicitudLabel, estadoSolicitudColor, formatDate } from '../../utils/helpers';

import useTenantPath from '../../hooks/useTenantPath';

export default function MisSolicitudes() {
  const tenantPath = useTenantPath();
  const { data: solicitudes = [], loading } = useAsyncData(
    () => api.get('/adopciones/mis-solicitudes').then((res) => res.data.data.solicitudes),
    []
  );

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Mis solicitudes de adopción</h1>
      {solicitudes.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center">
          <p className="text-brown-soft mb-4">No tienes solicitudes aún</p>
          <Link to={tenantPath('mascotas')} className="text-terracotta font-medium">Explorar mascotas</Link>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {solicitudes.map((s) => (
            <div key={s.id} className="card p-3 sm:p-4 flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 items-center">
              <img src={getImageUrl(s.mascota_imagen)} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{s.mascota_nombre}</p>
                <p className="text-sm text-brown-soft">{formatDate(s.created_at)}</p>
                {s.estado === 'aprobada' && (
                  <Link
                    to={tenantPath('panel/seguimiento')}
                    className="text-sm text-terracotta font-medium mt-1 inline-block hover:underline"
                  >
                    Ir al seguimiento post-adopción →
                  </Link>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium shrink-0 ${estadoSolicitudColor[s.estado]}`}>
                {estadoSolicitudLabel[s.estado]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
