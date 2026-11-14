import { useState } from 'react';
import { Siren, Search, PawPrint } from 'lucide-react';
import api from '../services/api';
import useAsyncData from '../hooks/useAsyncData';
import useTenantStore from '../context/tenantStore';
import { SkeletonCard } from '../components/ui/Skeleton';
import AvisoPerdidoForm from '../components/perdidos/AvisoPerdidoForm';
import AvisoPerdidoCard from '../components/perdidos/AvisoPerdidoCard';

const FILTROS = [
  { value: '', label: 'Todos' },
  { value: 'perdido', label: 'Perdidos' },
  { value: 'encontrado', label: 'Encontrados' },
];

export default function PerdidosEncontrados() {
  const { refugio } = useTenantStore();
  const [formTipo, setFormTipo] = useState(null);
  const [filtro, setFiltro] = useState('');

  const { data, loading } = useAsyncData(
    () => api.get('/perdidos', { params: filtro ? { tipo: filtro } : {} }).then((res) => res.data.data.avisos),
    [filtro]
  );
  const avisos = data || [];

  const abrirFormulario = (tipo) => {
    setFormTipo(tipo);
    requestAnimationFrame(() => document.getElementById('aviso-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-12">
      <div className="text-center mb-6 sm:mb-10">
        <Siren className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3" />
        <h1 className="section-title mb-2">Perdidos y encontrados</h1>
        <p className="section-subtitle mx-auto">
          ¿Se perdió tu mascota o encontraste una abandonada? Envianos una foto: lo revisamos y lo publicamos para ayudar a que vuelva a casa.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto mb-6 sm:mb-10">
        <button
          type="button"
          onClick={() => abrirFormulario('perdido')}
          className={`card p-4 sm:p-6 flex items-center gap-4 text-left border-2 transition hover:shadow-card ${
            formTipo === 'perdido' ? 'border-red-400' : 'border-transparent'
          }`}
        >
          <span className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
            <Search className="w-6 h-6 sm:w-7 sm:h-7" />
          </span>
          <span>
            <span className="block font-semibold text-brown-dark sm:text-lg">Se me perdió mi mascota</span>
            <span className="block text-sm text-brown-soft">Publicá su foto y dónde la viste por última vez</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => abrirFormulario('encontrado')}
          className={`card p-4 sm:p-6 flex items-center gap-4 text-left border-2 transition hover:shadow-card ${
            formTipo === 'encontrado' ? 'border-emerald-400' : 'border-transparent'
          }`}
        >
          <span className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <PawPrint className="w-6 h-6 sm:w-7 sm:h-7" />
          </span>
          <span>
            <span className="block font-semibold text-brown-dark sm:text-lg">Encontré una mascota abandonada</span>
            <span className="block text-sm text-brown-soft">Ayudanos a encontrar a su familia</span>
          </span>
        </button>
      </div>

      {formTipo && (
        <div id="aviso-form" className="max-w-3xl mx-auto mb-8 sm:mb-12 scroll-mt-20">
          <AvisoPerdidoForm
            key={formTipo}
            tipo={formTipo}
            onCancel={() => setFormTipo(null)}
            onSent={() => setFormTipo(null)}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold">Avisos publicados</h2>
        <div className="flex gap-1 p-1 rounded-xl bg-cream-100">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltro(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filtro === f.value ? 'bg-warm-white text-terracotta shadow-soft' : 'text-brown-soft hover:text-brown-dark'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : avisos.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center text-brown-soft">
          No hay avisos publicados {filtro === 'perdido' ? 'de mascotas perdidas' : filtro === 'encontrado' ? 'de mascotas encontradas' : ''} en este momento.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {avisos.map((a) => <AvisoPerdidoCard key={a.id} aviso={a} refugioNombre={refugio?.nombre} />)}
        </div>
      )}
    </div>
  );
}
