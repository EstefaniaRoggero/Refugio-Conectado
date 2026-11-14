import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import api from '../services/api';
import useAsyncData from '../hooks/useAsyncData';
import { SkeletonCard } from '../components/ui/Skeleton';
import NoticiaCard from '../components/noticias/NoticiaCard';
import { NOTICIA_TIPO_OPTIONS } from '../constants/noticias';

const FILTROS = [{ value: '', label: 'Todas' }, ...NOTICIA_TIPO_OPTIONS];

export default function Novedades() {
  const [filtro, setFiltro] = useState('');
  const { data, loading } = useAsyncData(
    () => api.get('/noticias', { params: filtro ? { tipo: filtro } : {} }).then((res) => res.data.data.noticias),
    [filtro]
  );
  const noticias = data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-12">
      <div className="text-center mb-6 sm:mb-10">
        <Megaphone className="w-10 h-10 sm:w-12 sm:h-12 text-terracotta mx-auto mb-3" />
        <h1 className="section-title mb-2">Novedades</h1>
        <p className="section-subtitle mx-auto">
          Campañas de vacunación y castración, eventos y todo lo que está pasando en el refugio.
        </p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-cream-100 mb-6 sm:mb-8 overflow-x-auto max-w-full w-fit mx-auto">
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : noticias.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center text-brown-soft">
          No hay novedades publicadas en este momento.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {noticias.map((n) => <NoticiaCard key={n.id} noticia={n} />)}
        </div>
      )}
    </div>
  );
}
