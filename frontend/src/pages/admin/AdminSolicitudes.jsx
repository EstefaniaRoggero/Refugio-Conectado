import { useState } from 'react';
import api from '../../services/api';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import useAsyncData from '../../hooks/useAsyncData';
import { showSuccess } from '../../utils/alerts';
import { estadoSolicitudLabel, estadoSolicitudColor, formatDate } from '../../utils/helpers';

export default function AdminSolicitudes() {
  const [filtro, setFiltro] = useState('');
  const { data: solicitudes = [], loading, reload } = useAsyncData(
    () => api.get('/adopciones', { params: filtro ? { estado: filtro } : {} })
      .then((res) => res.data.data.solicitudes),
    [filtro]
  );

  const cambiarEstado = async (id, estado) => {
    await api.patch(`/adopciones/${id}/estado`, { estado });
    showSuccess(`Solicitud ${estado}`);
    reload();
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Solicitudes de adopción</h1>
        <select className="input-field !w-full sm:!w-auto" value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todas</option>
          <option value="pendiente">Pendientes</option>
          <option value="aprobada">Aprobadas</option>
          <option value="rechazada">Rechazadas</option>
        </select>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {solicitudes.map((s) => (
          <div key={s.id} className="card p-4 sm:p-5">
            <div className="flex justify-between items-start gap-3 mb-3">
              <div className="min-w-0">
                <p className="font-semibold">{s.usuario_nombre} {s.usuario_apellido}</p>
                <p className="text-sm text-brown-soft break-all">
                  {s.usuario_email}{s.usuario_telefono && ` • ${s.usuario_telefono}`}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs sm:text-sm h-fit shrink-0 ${estadoSolicitudColor[s.estado]}`}>
                {estadoSolicitudLabel[s.estado]}
              </span>
            </div>
            <p className="text-sm sm:text-base mb-2">Mascota: <strong>{s.mascota_nombre}</strong> — {formatDate(s.created_at)}</p>
            <p className="text-sm text-brown-soft mb-2 break-words">Motivo: {s.motivo_adopcion}</p>
            {s.estado === 'pendiente' && (
              <div className="grid grid-cols-2 sm:flex gap-2 mt-3">
                <Button onClick={() => cambiarEstado(s.id, 'aprobada')}>Aprobar</Button>
                <Button variant="secondary" onClick={() => cambiarEstado(s.id, 'rechazada')}>Rechazar</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
