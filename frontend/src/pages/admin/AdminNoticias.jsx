import { useState } from 'react';
import { Calendar, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import NoticiaForm from '../../components/noticias/NoticiaForm';
import useAsyncData from '../../hooks/useAsyncData';
import { showConfirm, showError, showSuccess } from '../../utils/alerts';
import { getImageUrl } from '../../utils/helpers';
import { formatFechaAviso } from '../../constants/perdidos';
import { NOTICIA_TIPO_COLOR, NOTICIA_TIPO_LABEL } from '../../constants/noticias';

export default function AdminNoticias() {
  const [editando, setEditando] = useState(null);
  const { data, loading, reload } = useAsyncData(
    () => api.get('/noticias/admin').then((res) => res.data.data.noticias),
    []
  );
  const noticias = data || [];

  const abrirFormulario = (noticia) => {
    setEditando(noticia || 'nueva');
    requestAnimationFrame(() => document.getElementById('noticia-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const cerrarFormulario = () => setEditando(null);

  const eliminar = async (noticia) => {
    const r = await showConfirm('¿Eliminar novedad?', 'Esta acción no se puede deshacer');
    if (!r.isConfirmed) return;
    try {
      await api.delete(`/noticias/admin/${noticia.id}`);
      showSuccess('Novedad eliminada');
      if (editando?.id === noticia.id) cerrarFormulario();
      reload();
    } catch (err) {
      showError('Error', err.response?.data?.message);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Novedades</h1>
          <p className="text-sm text-brown-soft">
            Publicá campañas de vacunación, castraciones, eventos y noticias. Las ve cualquier persona, sin registrarse.
          </p>
        </div>
        {!editando && (
          <Button onClick={() => abrirFormulario(null)}>
            <Plus className="w-4 h-4" /> Nueva novedad
          </Button>
        )}
      </div>

      {editando && (
        <div id="noticia-form" className="mb-6 scroll-mt-20">
          <NoticiaForm
            key={editando === 'nueva' ? 'nueva' : editando.id}
            noticia={editando === 'nueva' ? null : editando}
            onCancel={cerrarFormulario}
            onSaved={() => { cerrarFormulario(); reload(); }}
          />
        </div>
      )}

      {loading ? (
        <Loader />
      ) : noticias.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center text-brown-soft">
          Todavía no cargaste novedades.
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {noticias.map((n) => (
            <div key={n.id} className="card p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
              {n.imagen && (
                <img
                  src={getImageUrl(n.imagen)}
                  alt=""
                  className="w-full sm:w-36 h-40 sm:h-24 rounded-xl object-cover shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${NOTICIA_TIPO_COLOR[n.tipo]}`}>
                    {NOTICIA_TIPO_LABEL[n.tipo]}
                  </span>
                  {n.publicada ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Publicada</span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cream-200 text-brown-soft">Oculta</span>
                  )}
                  {Boolean(n.vencida) && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cream-200 text-brown-soft">
                      Vencida (ya no se muestra)
                    </span>
                  )}
                  {Boolean(n.destacada) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-terracotta/10 text-terracotta">
                      <Star className="w-3 h-3" /> Destacada
                    </span>
                  )}
                </div>
                <p className="font-semibold text-base text-brown-dark break-words">{n.titulo}</p>
                {n.fecha_evento && (
                  <p className="flex items-center gap-1.5 text-sm text-brown-soft mt-1">
                    <Calendar className="w-4 h-4 shrink-0" /> {formatFechaAviso(n.fecha_evento)}
                    {n.horario && <span>· {n.horario}</span>}
                  </p>
                )}
                <p className="text-sm text-brown-soft mt-1 line-clamp-2 break-words">{n.contenido}</p>
              </div>
              <div className="flex sm:flex-col gap-2 shrink-0">
                <Button variant="secondary" onClick={() => abrirFormulario(n)} className="flex-1 sm:flex-none">
                  <Pencil className="w-4 h-4" /> Editar
                </Button>
                <button
                  type="button"
                  onClick={() => eliminar(n)}
                  className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl"
                  title="Eliminar"
                  aria-label="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
