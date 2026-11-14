import { useState } from 'react';
import { MapPin, Calendar, Phone, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import useAsyncData from '../../hooks/useAsyncData';
import { showConfirm, showError, showPrompt, showSuccess } from '../../utils/alerts';
import { getImageUrl } from '../../utils/helpers';
import {
  AVISO_TIPO_LABEL,
  AVISO_TIPO_COLOR,
  AVISO_ESTADO_LABEL,
  AVISO_ESTADO_COLOR,
  buildWhatsAppLink,
  formatFechaAviso,
} from '../../constants/perdidos';

const FILTROS = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'publicado', label: 'Publicados' },
  { value: 'resuelto', label: 'Resueltos' },
  { value: 'rechazado', label: 'Rechazados' },
];

const especieLabel = { perro: 'Perro', gato: 'Gato', otro: 'Otra especie' };

export default function AdminPerdidos() {
  const [filtro, setFiltro] = useState('');
  const { data, loading, reload } = useAsyncData(
    () => api.get('/perdidos/admin', { params: filtro ? { estado: filtro } : {} }).then((res) => res.data.data.avisos),
    [filtro]
  );
  const avisos = data || [];

  const cambiarEstado = async (aviso, estado) => {
    let motivo;
    if (estado === 'rechazado') {
      const r = await showPrompt('¿Rechazar aviso?', { placeholder: 'Motivo (opcional)', confirmText: 'Rechazar' });
      if (!r.isConfirmed) return;
      motivo = r.value;
    }
    try {
      const res = await api.patch(`/perdidos/admin/${aviso.id}/estado`, { estado, motivo_rechazo: motivo });
      showSuccess(res.data.message);
      reload();
    } catch (err) {
      showError('Error', err.response?.data?.message);
    }
  };

  const eliminar = async (aviso) => {
    const r = await showConfirm('¿Eliminar aviso?', 'Esta acción no se puede deshacer');
    if (!r.isConfirmed) return;
    try {
      await api.delete(`/perdidos/admin/${aviso.id}`);
      showSuccess('Aviso eliminado');
      reload();
    } catch (err) {
      showError('Error', err.response?.data?.message);
    }
  };

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-2">Perdidos y encontrados</h1>
      <p className="text-sm text-brown-soft mb-4 sm:mb-6">
        Revisá los avisos antes de publicarlos. Los publicados se ocultan solos a los 30 días si nadie los marca como resueltos.
      </p>

      <div className="flex gap-1 p-1 rounded-xl bg-cream-100 mb-4 sm:mb-6 overflow-x-auto">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltro(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              filtro === f.value ? 'bg-warm-white text-terracotta shadow-soft' : 'text-brown-soft hover:text-brown-dark'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : avisos.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center text-brown-soft">No hay avisos en esta categoría.</div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {avisos.map((a) => {
            const waLink = buildWhatsAppLink(a.contacto_telefono, `Hola ${a.contacto_nombre}, te escribimos del refugio por tu aviso.`);
            return (
              <div key={a.id} className={`card p-4 sm:p-5 ${a.estado === 'pendiente' ? 'border-l-4 border-l-amber-400' : ''}`}>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${AVISO_TIPO_COLOR[a.tipo]}`}>
                    {AVISO_TIPO_LABEL[a.tipo]}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${AVISO_ESTADO_COLOR[a.estado]}`}>
                    {AVISO_ESTADO_LABEL[a.estado]}
                  </span>
                  {a.vencido && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cream-200 text-brown-soft">
                      Vencido (ya no se muestra)
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => eliminar(a)}
                    className="ml-auto p-2 -m-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Eliminar"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex gap-2 overflow-x-auto shrink-0">
                    {a.imagenes.map((img) => (
                      <a key={img.id} href={getImageUrl(img.url)} target="_blank" rel="noreferrer" className="shrink-0">
                        <img src={getImageUrl(img.url)} alt="" className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover" />
                      </a>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold text-base text-brown-dark">
                      {a.nombre_mascota || especieLabel[a.especie]}
                      {a.nombre_mascota && <span className="font-normal text-brown-soft"> · {especieLabel[a.especie]}</span>}
                    </p>
                    <p className="flex items-center gap-1.5 text-brown-soft mt-1">
                      <MapPin className="w-4 h-4 shrink-0" /> <span className="break-words">{a.zona}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-brown-soft">
                      <Calendar className="w-4 h-4 shrink-0" /> {formatFechaAviso(a.fecha_evento)}
                      {a.tipo === 'encontrado' && a.resguardado !== null && (
                        <span>· {a.resguardado ? 'Resguardado' : 'Sigue en la calle'}</span>
                      )}
                    </p>
                    <p className="mt-2 text-brown-dark break-words whitespace-pre-line">{a.descripcion}</p>
                    <p className="flex flex-wrap items-center gap-1.5 mt-2 text-brown-soft">
                      <Phone className="w-4 h-4 shrink-0" />
                      {a.contacto_nombre} ·{' '}
                      {waLink ? (
                        <a href={waLink} target="_blank" rel="noreferrer" className="text-terracotta hover:underline">
                          {a.contacto_telefono}
                        </a>
                      ) : a.contacto_telefono}
                    </p>
                    {a.estado === 'rechazado' && a.motivo_rechazo && (
                      <p className="mt-2 text-xs text-brown-soft">Motivo del rechazo: {a.motivo_rechazo}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex gap-2 mt-4">
                  {a.estado === 'pendiente' && (
                    <>
                      <Button onClick={() => cambiarEstado(a, 'publicado')}>Publicar</Button>
                      <Button variant="secondary" onClick={() => cambiarEstado(a, 'rechazado')}>Rechazar</Button>
                    </>
                  )}
                  {a.estado === 'publicado' && (
                    <>
                      <Button onClick={() => cambiarEstado(a, 'resuelto')}>Volvió a casa</Button>
                      {a.vencido && (
                        <Button variant="secondary" onClick={() => cambiarEstado(a, 'publicado')}>Volver a publicar</Button>
                      )}
                    </>
                  )}
                  {['rechazado', 'resuelto'].includes(a.estado) && (
                    <Button variant="secondary" onClick={() => cambiarEstado(a, 'publicado')}>Publicar de nuevo</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
