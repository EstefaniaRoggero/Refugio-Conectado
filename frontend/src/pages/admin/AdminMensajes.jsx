import { Mail, MailOpen, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/ui/Loader';
import useAsyncData from '../../hooks/useAsyncData';
import { formatDate } from '../../utils/helpers';
import { showConfirm } from '../../utils/alerts';

export default function AdminMensajes() {
  const { data: mensajes = [], loading, reload } = useAsyncData(
    () => api.get('/mensajes').then((res) => res.data.data.mensajes),
    []
  );

  const marcarLeido = async (id) => { await api.patch(`/mensajes/${id}/leido`); reload(); };
  const eliminar = async (id) => {
    const r = await showConfirm('¿Eliminar mensaje?');
    if (r.isConfirmed) { await api.delete(`/mensajes/${id}`); reload(); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Mensajes de contacto</h1>
      <div className="space-y-3">
        {mensajes.map((m) => (
          <div key={m.id} className={`card p-4 sm:p-5 ${!m.leido ? 'border-l-4 border-l-terracotta' : ''}`}>
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-semibold break-words">{m.nombre} — {m.asunto}</p>
                <p className="text-sm text-brown-soft break-all">{m.email} • {formatDate(m.created_at)}</p>
              </div>
              <div className="flex gap-1 sm:gap-2 shrink-0">
                {!m.leido && <button onClick={() => marcarLeido(m.id)} className="p-2 hover:bg-cream-100 rounded-lg" title="Marcar como leído" aria-label="Marcar como leído"><MailOpen className="w-4 h-4" /></button>}
                <button onClick={() => eliminar(m.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg" title="Eliminar" aria-label="Eliminar"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-sm text-brown-soft break-words whitespace-pre-line">{m.mensaje}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
