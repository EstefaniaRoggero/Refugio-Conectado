import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/ui/Loader';
import RefugiosMap from '../components/map/RefugiosMap';
import { SITE_NAME } from '../constants/site';

async function fetchRefugios() {
  const urls = [
    '/api/refugios',
    `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/refugios`,
  ];

  let lastError;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = json?.data?.refugios ?? json?.refugios ?? [];
      if (Array.isArray(list)) return list;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('No se pudieron cargar los refugios');
}

export default function SeleccionRefugio() {
  const navigate = useNavigate();
  const [refugios, setRefugios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = `${SITE_NAME} — Elegí tu zona`;
    const link = document.querySelector("link[rel*='icon']");
    if (link) link.href = `/favicon.svg?v=2`;

    fetchRefugios()
      .then((list) => {
        setRefugios(list);
        setError(null);
      })
      .catch(() => {
        setRefugios([]);
        setError('No pudimos cargar los refugios. Verificá que el backend esté en marcha.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 via-warm-white to-cream-200 flex flex-col">
      <header className="max-w-6xl mx-auto w-full px-4 py-5 sm:py-8 flex items-center gap-3">
        <img src="/favicon.svg" alt={SITE_NAME} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shadow-sm shrink-0" />
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-brown-dark">{SITE_NAME}</h1>
          <p className="text-sm sm:text-base text-brown-soft">Elegí el refugio de tu zona para continuar</p>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pb-10 sm:pb-16 flex flex-col gap-8 sm:gap-10">
        {error && (
          <div className="card p-4 text-sm text-red-600 border border-red-200 bg-red-50">
            {error}
          </div>
        )}

        <section className="order-2 md:order-1">
          <h2 className="text-lg font-semibold text-brown-dark mb-2">Refugios en el mapa</h2>
          <p className="text-sm text-brown-soft mb-4">
            Cada marcador con nuestra huella indica un refugio que usa la plataforma. Hacé clic para ver detalles o ingresar.
          </p>
          <RefugiosMap
            refugios={refugios}
            onSelectRefugio={(slug) => navigate(`/${slug}`)}
            height="min(440px, 60vh)"
          />
        </section>

        <section className="order-1 md:order-2">
          <h2 className="text-lg font-semibold text-brown-dark mb-3 sm:mb-4">Seleccionar refugio</h2>
          {refugios.length === 0 ? (
            <div className="card p-8 text-center text-brown-soft text-sm">
              No hay refugios para mostrar.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {refugios.map((r, index) => (
                <button
                  key={r.id_refugio ?? r.slug ?? `refugio-${index}`}
                  type="button"
                  onClick={() => navigate(`/${r.slug}`)}
                  className="card p-4 sm:p-6 text-left hover:shadow-card hover:border-terracotta/30 border border-transparent transition group flex items-center gap-4 sm:block"
                >
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-terracotta/10 flex items-center justify-center sm:mb-4 group-hover:bg-terracotta/20 transition overflow-hidden">
                    <img src="/favicon.svg" alt="" className="w-10 h-10 rounded-lg" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-base sm:text-lg text-brown-dark mb-1">{r.nombre}</h2>
                    <p className="text-sm text-brown-soft flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" /> {r.ciudad}, Córdoba, Argentina
                    </p>
                    {r.descripcion && (
                      <p className="hidden sm:block text-sm text-brown-soft/80 mt-3 line-clamp-2">{r.descripcion}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
