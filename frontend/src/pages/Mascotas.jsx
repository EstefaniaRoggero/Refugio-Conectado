import { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import api from '../services/api';
import MascotaCard from '../components/mascotas/MascotaCard';
import { SkeletonCard } from '../components/ui/Skeleton';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import {
  withFilterAll,
  MASCOTA_TAMANO_OPTIONS,
  MASCOTA_TIPO_OPTIONS,
  MASCOTA_SEXO_OPTIONS,
  MASCOTA_ENERGIA_OPTIONS,
  MASCOTA_BOOLEAN_FILTER_OPTIONS,
} from '../constants/mascota';

export default function Mascotas() {
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [filtros, setFiltros] = useState({
    busqueda: '', tamano: '', sexo: '', energia: '', tipo: '', compatible_ninos: '', compatible_mascotas: '',
  });
  const [busqueda, setBusqueda] = useState('');
  const [showFiltros, setShowFiltros] = useState(false);

  const fetchMascotas = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...filtros };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await api.get('/mascotas', { params });
      setMascotas(data.data.mascotas);
      setPagination(data.data.pagination);
    } catch {
      setMascotas([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFiltros((f) => ({ ...f, busqueda }));
    }, 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => { fetchMascotas(1); }, [fetchMascotas]);

  const filtrosActivos = Object.entries(filtros).filter(([k, v]) => k !== 'busqueda' && v).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-12">
      <div className="mb-5 sm:mb-10">
        <h1 className="section-title mb-2">Nuestras Mascotas</h1>
        <p className="section-subtitle">Encuentra a tu compañero ideal</p>
        <p className="hidden sm:block text-sm text-brown-soft/80 mt-2 max-w-xl">
          Priorizamos a quienes llevan más tiempo buscando hogar, sin dejar de destacar a nuestros rescatados especiales.
        </p>
      </div>

      <div className="card p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex gap-2 lg:col-span-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-soft" />
              <input
                className="input-field pl-10"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFiltros((v) => !v)}
              className={`md:hidden inline-flex items-center gap-1.5 px-3 rounded-xl border text-sm font-medium transition ${
                showFiltros || filtrosActivos ? 'border-terracotta text-terracotta bg-terracotta/5' : 'border-cream-200 text-brown-soft'
              }`}
              aria-expanded={showFiltros}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros{filtrosActivos > 0 && ` (${filtrosActivos})`}
            </button>
          </div>
          <div className={`${showFiltros ? 'grid' : 'hidden'} grid-cols-2 gap-3 md:contents`}>
          <Select label="Tamaño" options={withFilterAll(MASCOTA_TAMANO_OPTIONS)} value={filtros.tamano} onChange={(e) => setFiltros({ ...filtros, tamano: e.target.value })} />
          <Select label="Tipo" options={withFilterAll(MASCOTA_TIPO_OPTIONS)} value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })} />
          <Select label="Sexo" options={withFilterAll(MASCOTA_SEXO_OPTIONS)} value={filtros.sexo} onChange={(e) => setFiltros({ ...filtros, sexo: e.target.value })} />
          <Select label="Energía" options={withFilterAll(MASCOTA_ENERGIA_OPTIONS, 'Todas')} value={filtros.energia} onChange={(e) => setFiltros({ ...filtros, energia: e.target.value })} />
          <Select label="Compatible niños" options={MASCOTA_BOOLEAN_FILTER_OPTIONS} value={filtros.compatible_ninos} onChange={(e) => setFiltros({ ...filtros, compatible_ninos: e.target.value })} />
          <Select label="Compatible mascotas" options={MASCOTA_BOOLEAN_FILTER_OPTIONS} value={filtros.compatible_mascotas} onChange={(e) => setFiltros({ ...filtros, compatible_mascotas: e.target.value })} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">{[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}</div>
      ) : mascotas.length === 0 ? (
        <div className="text-center py-12 sm:py-20 px-4 card">
          <p className="text-brown-soft sm:text-lg">No se encontraron mascotas con estos filtros</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {mascotas.map((m, i) => <MascotaCard key={m.id} mascota={m} index={i} />)}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mt-8 sm:mt-10">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === pagination.page ? 'primary' : 'secondary'}
              className="min-w-[2.75rem] !px-3"
              onClick={() => {
                fetchMascotas(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
