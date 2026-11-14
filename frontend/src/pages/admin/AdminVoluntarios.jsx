import { useCallback, useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import VoluntarioCalendarioSemanal from '../../components/voluntarios/VoluntarioCalendarioSemanal';
import VoluntarioTurnoForm from '../../components/voluntarios/VoluntarioTurnoForm';
import useAsyncData from '../../hooks/useAsyncData';
import { showConfirm, showSuccess } from '../../utils/alerts';

export default function AdminVoluntarios() {
  const [turnos, setTurnos] = useState([]);
  const [loadingCalendario, setLoadingCalendario] = useState(true);

  const { data: voluntarios = [], loading, reload } = useAsyncData(
    () => api.get('/voluntarios').then((res) => res.data.data.voluntarios),
    []
  );

  const cargarCalendario = useCallback(async () => {
    setLoadingCalendario(true);
    try {
      const res = await api.get('/voluntarios/calendario');
      setTurnos(res.data.data.turnos || []);
    } finally {
      setLoadingCalendario(false);
    }
  }, []);

  useEffect(() => {
    cargarCalendario();
  }, [cargarCalendario]);

  if (loading) return <Loader />;

  const lista = voluntarios ?? [];
  const aprobados = lista.filter((v) => v.estado === 'aprobado');

  const cambiar = async (id, estado) => {
    await api.patch(`/voluntarios/${id}/estado`, { estado });
    showSuccess('Estado actualizado');
    reload();
    if (estado === 'aprobado') cargarCalendario();
  };

  const quitarTurno = async (turno) => {
    const r = await showConfirm('¿Eliminar turno?', `${turno.nombre}: ${turno.hora_inicio} – ${turno.hora_fin}`);
    if (!r.isConfirmed) return;
    await api.delete(`/voluntarios/turnos/${turno.id}`);
    showSuccess('Turno eliminado');
    cargarCalendario();
  };

  const refrescar = async () => {
    await cargarCalendario();
  };

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-2">Voluntarios</h1>
      <p className="text-brown-soft text-sm mb-5 sm:mb-8">
        Gestioná solicitudes y el calendario semanal de colaboración del refugio.
      </p>

      <section className="mb-8 sm:mb-10">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-terracotta" />
          <h2 className="text-lg font-bold">Calendario de cobertura</h2>
        </div>
        {loadingCalendario ? (
          <Loader />
        ) : (
          <VoluntarioCalendarioSemanal
            turnos={turnos}
            editable
            onRemove={quitarTurno}
          />
        )}
        {aprobados.length > 0 && (
          <div className="mt-6">
            <VoluntarioTurnoForm
              adminMode
              voluntariosAprobados={aprobados}
              onSaved={refrescar}
            />
          </div>
        )}
      </section>

      <h2 className="text-lg font-bold mb-4">Solicitudes</h2>
      <div className="space-y-3 sm:space-y-4">
        {lista.length === 0 ? (
          <div className="card p-6 sm:p-8 text-center text-brown-soft">No hay solicitudes de voluntariado.</div>
        ) : (
          lista.map((v) => (
            <div key={v.id} className="card p-4 sm:p-5">
              <div className="flex justify-between items-start gap-3 mb-2">
                <p className="font-semibold min-w-0">{v.nombre} {v.apellido}</p>
                <span className="capitalize text-sm sm:text-base text-terracotta shrink-0">{v.estado}</span>
              </div>
              <p className="text-sm text-brown-soft break-all">
                {v.email}{v.telefono && ` • ${v.telefono}`}
              </p>
              <p className="text-sm mt-2 break-words"><strong>Disponibilidad:</strong> {v.disponibilidad}</p>
              {v.habilidades && <p className="text-sm break-words"><strong>Habilidades:</strong> {v.habilidades}</p>}
              {v.estado === 'pendiente' && (
                <div className="grid grid-cols-2 sm:flex gap-2 mt-3">
                  <Button onClick={() => cambiar(v.id, 'aprobado')}>Aprobar</Button>
                  <Button variant="secondary" onClick={() => cambiar(v.id, 'rechazado')}>Rechazar</Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
