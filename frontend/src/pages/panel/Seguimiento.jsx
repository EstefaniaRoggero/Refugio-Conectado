import { Link } from 'react-router-dom';
import { Camera, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/ui/Loader';
import useAsyncData from '../../hooks/useAsyncData';
import useTenantPath from '../../hooks/useTenantPath';
import { getImageUrl, formatDate } from '../../utils/helpers';
import {
  frecuenciaLabel,
  estadoReporteSeguimientoLabel,
  estadoReporteSeguimientoColor,
} from '../../constants/seguimiento';

export default function Seguimiento() {
  const tenantPath = useTenantPath();
  const { data: seguimientos = [], loading } = useAsyncData(
    () => api.get('/seguimiento/mis').then((res) => res.data.data.seguimientos),
    []
  );

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-2">Seguimiento post-adopción</h1>
      <p className="text-brown-soft mb-4 sm:mb-6 text-sm">
        Compartí fotos periódicas de tu mascota adoptada para que el refugio pueda hacer seguimiento.
      </p>

      {seguimientos.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center">
          <Camera className="w-12 h-12 text-brown-soft/40 mx-auto mb-4" />
          <p className="text-brown-soft mb-4">No tenés adopciones activas con seguimiento</p>
          <Link to={tenantPath('panel/solicitudes')} className="text-terracotta font-medium">
            Ver mis solicitudes
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {seguimientos.map((s) => (
            <Link
              key={s.id}
              to={tenantPath(`panel/seguimiento/${s.id}`)}
              className="card p-3 sm:p-4 flex gap-3 sm:gap-4 items-center hover:shadow-card transition group"
            >
              <img
                src={getImageUrl(s.mascota_imagen)}
                alt={s.mascota_nombre}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brown-dark truncate">{s.mascota_nombre}</p>
                <p className="text-sm text-brown-soft capitalize truncate">
                  {s.mascota_tipo} · {frecuenciaLabel[s.frecuencia_reporte]}
                </p>
                <p className="text-xs text-brown-soft mt-1">
                  Próximo reporte: {formatDate(s.proximo_reporte)}
                </p>
                <span className={`sm:hidden inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoReporteSeguimientoColor[s.estado_reporte]}`}>
                  {estadoReporteSeguimientoLabel[s.estado_reporte]}
                </span>
              </div>
              <span className={`hidden sm:inline-block px-3 py-1 rounded-full text-xs font-medium shrink-0 ${estadoReporteSeguimientoColor[s.estado_reporte]}`}>
                {estadoReporteSeguimientoLabel[s.estado_reporte]}
              </span>
              <ChevronRight className="w-5 h-5 text-brown-soft group-hover:text-terracotta shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
