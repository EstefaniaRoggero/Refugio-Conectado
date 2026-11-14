import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import useAsyncData from '../../hooks/useAsyncData';
import useTenantPath from '../../hooks/useTenantPath';
import { getImageUrl, formatDate } from '../../utils/helpers';
import { showSuccess } from '../../utils/alerts';
import {
  frecuenciaLabel,
  estadoReporteSeguimientoLabel,
  estadoReporteSeguimientoColor,
  estadoReporteItemLabel,
  estadoReporteItemColor,
} from '../../constants/seguimiento';

function AdminSeguimientoLista() {
  const tenantPath = useTenantPath();
  const { data: seguimientos = [], loading } = useAsyncData(
    () => api.get('/seguimiento/admin/lista').then((res) => res.data.data.seguimientos),
    []
  );

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-2">Seguimiento post-adopción</h1>
      <p className="text-brown-soft mb-4 sm:mb-6 text-sm">
        Adopciones activas con reportes periódicos de los adoptantes.
      </p>

      {seguimientos.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center text-brown-soft">
          No hay seguimientos activos en esta sede.
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {seguimientos.map((s) => (
            <Link
              key={s.id}
              to={tenantPath(`admin/seguimiento/${s.id}`)}
              className="card p-4 sm:p-5 block hover:shadow-card transition"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                <div className="flex gap-3 sm:gap-4 items-center min-w-0 flex-1">
                  <img
                    src={getImageUrl(s.mascota_imagen)}
                    alt=""
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{s.mascota_nombre}</p>
                    <p className="text-sm text-brown-soft truncate">
                      {s.usuario_nombre} {s.usuario_apellido}
                    </p>
                    <p className="text-xs text-brown-soft truncate">{s.usuario_email}</p>
                    <p className="text-xs text-brown-soft mt-1">
                      {frecuenciaLabel[s.frecuencia_reporte]} · {s.total_reportes} reporte(s)
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-start sm:justify-end sm:shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoReporteSeguimientoColor[s.estado_reporte]}`}>
                    {estadoReporteSeguimientoLabel[s.estado_reporte]}
                  </span>
                  {s.reportes_sin_revisar > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-terracotta/15 text-terracotta">
                      {s.reportes_sin_revisar} sin revisar
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminSeguimientoDetalle() {
  const { id } = useParams();
  const tenantPath = useTenantPath();
  const [notas, setNotas] = useState({});

  const { data, loading, reload } = useAsyncData(
    () => api.get(`/seguimiento/admin/${id}`).then((res) => res.data.data),
    [id]
  );

  const seguimiento = data?.seguimiento;
  const reportes = data?.reportes || [];

  const marcarRevisado = async (idReporte) => {
    await api.patch(`/seguimiento/admin/reportes/${idReporte}`, {
      notas_admin: notas[idReporte] || '',
    });
    showSuccess('Reporte revisado');
    reload();
  };

  if (loading) return <Loader />;
  if (!seguimiento) return <p className="text-brown-soft">Seguimiento no encontrado</p>;

  return (
    <div>
      <Link
        to={tenantPath('admin/seguimiento')}
        className="inline-flex items-center gap-2 text-brown-soft hover:text-terracotta mb-4 sm:mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
        <h1 className="text-xl font-bold">{seguimiento.mascota_nombre}</h1>
        <p className="text-brown-soft text-sm mt-1 break-words">
          Adoptante: {seguimiento.usuario_nombre} {seguimiento.usuario_apellido} ({seguimiento.usuario_email})
        </p>
        <p className="text-sm text-brown-soft mt-2">
          Frecuencia: {frecuenciaLabel[seguimiento.frecuencia_reporte]} · Próximo reporte: {formatDate(seguimiento.proximo_reporte)}
        </p>
      </div>

      <h2 className="font-semibold mb-4">Reportes recibidos</h2>
      {reportes.length === 0 ? (
        <div className="card p-8 text-center text-brown-soft text-sm">Sin reportes aún.</div>
      ) : (
        <div className="space-y-4">
          {reportes.map((r) => (
            <div key={r.id} className="card p-4 sm:p-5">
              <div className="flex justify-between items-start gap-2 mb-3">
                <p className="text-sm text-brown-soft">{formatDate(r.created_at)}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs ${estadoReporteItemColor[r.estado]}`}>
                  {estadoReporteItemLabel[r.estado]}
                </span>
              </div>
              {r.comentario && <p className="text-sm mb-3">{r.comentario}</p>}
              <div className="flex flex-wrap gap-2 mb-4">
                {(r.imagenes || []).map((img) => (
                  <a key={img.id} href={getImageUrl(img.url)} target="_blank" rel="noreferrer">
                    <img src={getImageUrl(img.url)} alt="" className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl object-cover" />
                  </a>
                ))}
              </div>
              {r.estado === 'enviado' && (
                <div className="border-t border-cream-200 pt-4 space-y-3">
                  <textarea
                    className="input-field min-h-[60px] text-sm"
                    placeholder="Nota para el adoptante (opcional)"
                    value={notas[r.id] || ''}
                    onChange={(e) => setNotas((n) => ({ ...n, [r.id]: e.target.value }))}
                  />
                  <Button onClick={() => marcarRevisado(r.id)} className="text-sm w-full sm:w-auto">
                    <CheckCircle className="w-4 h-4" /> Marcar como revisado
                  </Button>
                </div>
              )}
              {r.notas_admin && r.estado === 'revisado' && (
                <p className="text-sm text-brown-soft border-t border-cream-200 pt-3">
                  Nota enviada: {r.notas_admin}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminSeguimiento() {
  const { id } = useParams();
  if (id) return <AdminSeguimientoDetalle />;
  return <AdminSeguimientoLista />;
}
