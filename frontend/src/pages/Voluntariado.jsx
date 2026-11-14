import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CalendarDays, HandHeart } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../context/authStore';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import VoluntarioCalendarioSemanal from '../components/voluntarios/VoluntarioCalendarioSemanal';
import VoluntarioTurnoForm from '../components/voluntarios/VoluntarioTurnoForm';
import { showSuccess, showError, showConfirm } from '../utils/alerts';
import useTenantPath from '../hooks/useTenantPath';

export default function Voluntariado() {
  const { register, handleSubmit } = useForm();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const tenantPath = useTenantPath();
  const [loading, setLoading] = useState(false);
  const [estado, setEstado] = useState(null);
  const [turnosCalendario, setTurnosCalendario] = useState([]);
  const [misTurnos, setMisTurnos] = useState([]);
  const [loadingCalendario, setLoadingCalendario] = useState(true);

  const cargarCalendario = useCallback(async () => {
    setLoadingCalendario(true);
    try {
      const res = await api.get('/voluntarios/calendario');
      setTurnosCalendario(res.data.data.turnos || []);
    } catch {
      setTurnosCalendario([]);
    } finally {
      setLoadingCalendario(false);
    }
  }, []);

  const cargarMisTurnos = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [solRes, turnosRes] = await Promise.all([
        api.get('/voluntarios/mi-solicitud'),
        api.get('/voluntarios/turnos/mios'),
      ]);
      setEstado(solRes.data.data.voluntario);
      setMisTurnos(turnosRes.data.data.turnos || []);
    } catch {
      /* ignore */
    }
  }, [isAuthenticated]);

  useEffect(() => {
    cargarCalendario();
    cargarMisTurnos();
  }, [cargarCalendario, cargarMisTurnos]);

  const onSubmit = async (data) => {
    if (!isAuthenticated) return navigate(tenantPath('login'));
    setLoading(true);
    try {
      await api.post('/voluntarios', { ...data, transporte: data.transporte === 'true' });
      await showSuccess('¡Enviado!', 'Revisaremos tu solicitud de voluntariado');
      await cargarMisTurnos();
    } catch (err) {
      showError('Error', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const quitarMiTurno = async (turno) => {
    const r = await showConfirm('¿Quitar turno?', `${turno.hora_inicio} – ${turno.hora_fin}`);
    if (!r.isConfirmed) return;
    try {
      await api.delete(`/voluntarios/turnos/${turno.id}`);
      showSuccess('Turno eliminado');
      await Promise.all([cargarCalendario(), cargarMisTurnos()]);
    } catch (err) {
      showError('Error', err.response?.data?.message);
    }
  };

  const esAprobado = estado?.estado === 'aprobado';

  const refrescarTurnos = async () => {
    await Promise.all([cargarCalendario(), cargarMisTurnos()]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-12">
      <div className="text-center mb-6 sm:mb-10">
        <HandHeart className="w-10 h-10 sm:w-12 sm:h-12 text-terracotta mx-auto mb-3 sm:mb-4" />
        <h1 className="section-title mb-2">Voluntariado</h1>
        <p className="section-subtitle mx-auto">Tu tiempo y talento pueden cambiar vidas</p>
      </div>

      <section className="mb-8 sm:mb-12">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-terracotta" />
          <h2 className="text-lg sm:text-xl font-bold">Calendario de colaboración</h2>
        </div>
        <p className="text-sm text-brown-soft mb-4 sm:mb-6">
          Horarios cubiertos por personas que colaboran en el refugio esta semana.
        </p>

        {loadingCalendario ? (
          <Loader />
        ) : turnosCalendario.length === 0 ? (
          <div className="card p-6 sm:p-10 text-center text-brown-soft text-sm">
            Aún no hay turnos registrados. Cuando se aprueben voluntarios, sus horarios aparecerán aquí.
          </div>
        ) : (
          <VoluntarioCalendarioSemanal turnos={turnosCalendario} />
        )}
      </section>

      {estado && (
        <div className="card p-4 mb-6 text-center">
          <p className="text-sm text-brown-soft">Estado de tu solicitud:</p>
          <p className="font-semibold text-terracotta capitalize">{estado.estado}</p>
        </div>
      )}

      {esAprobado && (
        <section className="mb-10 space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-2">Mis turnos en el refugio</h2>
            <p className="text-sm text-brown-soft mb-4">
              Registrá los días y horarios en los que podés colaborar. Aparecerán en el calendario público.
            </p>
            {misTurnos.length > 0 ? (
              <VoluntarioCalendarioSemanal
                turnos={misTurnos}
                showStats={false}
                editable
                onRemove={quitarMiTurno}
                emptyMessage="Sin turnos"
              />
            ) : (
              <p className="text-sm text-brown-soft mb-4">Todavía no registraste horarios.</p>
            )}
          </div>
          <VoluntarioTurnoForm onSaved={refrescarTurnos} />
        </section>
      )}

      {!esAprobado && (
        <form onSubmit={handleSubmit(onSubmit)} className="card p-4 sm:p-8 space-y-4 max-w-2xl mx-auto">
          <h2 className="font-semibold text-lg">Sumate como voluntario</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Disponibilidad *</label>
            <textarea
              className="input-field min-h-[80px]"
              placeholder="Ej: Sábados 9am-1pm, Domingos tarde"
              {...register('disponibilidad', { required: true })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Habilidades</label>
            <textarea
              className="input-field min-h-[60px]"
              placeholder="Veterinaria, fotografía, transporte..."
              {...register('habilidades')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Experiencia</label>
            <textarea className="input-field min-h-[60px]" {...register('experiencia')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">¿Tienes transporte propio?</label>
            <select className="input-field" {...register('transporte')}>
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Enviar solicitud
          </Button>
        </form>
      )}
    </div>
  );
}
