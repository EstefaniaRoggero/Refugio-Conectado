import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Syringe, Activity, Shield, ArrowLeft, Stethoscope, Calendar, QrCode } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import api from '../services/api';
import useAuthStore from '../context/authStore';
import Loader from '../components/ui/Loader';
import Button from '../components/ui/Button';
import MascotaQrModal from '../components/mascotas/MascotaQrModal';
import { getImageUrl, estadoMascotaLabel } from '../utils/helpers';
import useTenantPath from '../hooks/useTenantPath';

export default function MascotaDetalle() {
  const { id, slug } = useParams();
  const tenantPath = useTenantPath();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.get(`/mascotas/${id}`).then((res) => setData(res.data.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader fullScreen />;
  if (!data?.mascota) return <div className="text-center py-20">Mascota no encontrada</div>;

  const { mascota, esFavorito, historialMedico = [] } = data;

  const tipoHistorialLabel = {
    vacuna: 'Vacuna',
    cirugia: 'Cirugía',
    consulta: 'Consulta',
    desparasitacion: 'Desparasitación',
    esterilizacion: 'Esterilización',
    tratamiento: 'Tratamiento',
    otro: 'Otro',
  };

  const toggleFav = async () => {
    if (!isAuthenticated) return navigate(tenantPath('login'), { state: { from: location } });
    await api.post('/favoritos/toggle', { mascota_id: mascota.id });
    setData((d) => ({ ...d, esFavorito: !d.esFavorito }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 sm:py-12">
      <Link to={tenantPath('mascotas')} className="inline-flex items-center gap-2 text-sm sm:text-base text-brown-soft hover:text-terracotta mb-4 sm:mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver al catálogo
      </Link>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden lg:self-start">
          <img src={getImageUrl(mascota.imagen)} alt={mascota.nombre} className="w-full aspect-[4/3] sm:aspect-square object-cover" />
        </motion.div>

        <div className="min-w-0">
          <div className="flex justify-between items-start gap-3 mb-3 sm:mb-4">
            <div className="min-w-0">
              <span className="text-sm text-terracotta font-medium capitalize">{mascota.tipo}</span>
              <h1 className="text-3xl sm:text-4xl font-bold text-brown-dark break-words">{mascota.nombre}</h1>
            </div>
            <button onClick={toggleFav} aria-label="Favorito" className={`p-2.5 sm:p-3 rounded-full shrink-0 ${esFavorito ? 'bg-terracotta text-white' : 'bg-cream-200'}`}>
              <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${esFavorito ? 'fill-current' : ''}`} />
            </button>
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-orange-soft/50 text-terracotta text-sm mb-4 sm:mb-6">
            {estadoMascotaLabel[mascota.estado]}
          </span>

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 mb-6 sm:mb-8">
            {[
              { label: 'Edad', value: `${mascota.edad} ${mascota.edad_unidad || 'años'}` },
              { label: 'Raza', value: mascota.raza_nombre || 'Sin especificar' },
              { label: 'Tamaño', value: mascota.tamano },
              { label: 'Sexo', value: mascota.sexo },
              { label: 'Energía', value: mascota.energia },
            ].map((item) => (
              <div key={item.label} className="card p-2 sm:p-3 text-center">
                <p className="text-xs text-brown-soft">{item.label}</p>
                <p className="text-sm sm:text-base font-semibold capitalize break-words">{item.value}</p>
              </div>
            ))}
          </div>

          <p className="text-brown-soft mb-6 leading-relaxed">{mascota.descripcion}</p>

          {mascota.historia && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Su historia</h3>
              <p className="text-brown-soft text-sm leading-relaxed">{mascota.historia}</p>
            </div>
          )}

          <div className="space-y-3 mb-8">
            {mascota.vacunas && (
              <div className="flex gap-3 items-start">
                <Syringe className="w-5 h-5 text-terracotta shrink-0" />
                <div><p className="font-medium text-sm">Vacunas</p><p className="text-sm text-brown-soft">{mascota.vacunas}</p></div>
              </div>
            )}
            {mascota.estado_medico && (
              <div className="flex gap-3 items-start">
                <Activity className="w-5 h-5 text-terracotta shrink-0" />
                <div><p className="font-medium text-sm">Estado médico</p><p className="text-sm text-brown-soft">{mascota.estado_medico}</p></div>
              </div>
            )}
            {mascota.comportamiento && (
              <div className="flex gap-3 items-start">
                <Shield className="w-5 h-5 text-terracotta shrink-0" />
                <div><p className="font-medium text-sm">Comportamiento</p><p className="text-sm text-brown-soft">{mascota.comportamiento}</p></div>
              </div>
            )}
          </div>

          {historialMedico.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-terracotta" />
                Historial médico
              </h3>
              <div className="space-y-3">
                {historialMedico.map((h) => (
                  <div key={h.id_historial} className="card p-4 border-l-4 border-l-terracotta/50">
                    <div className="flex flex-wrap justify-between gap-2 mb-1">
                      <span className="font-medium text-brown-dark">{h.procedimiento}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cream-200 text-brown-soft capitalize">
                        {tipoHistorialLabel[h.tipo] || h.tipo}
                      </span>
                    </div>
                    <p className="text-sm text-brown-soft flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(h.fecha)}
                      {h.veterinario && ` · ${h.veterinario}`}
                    </p>
                    {h.descripcion && <p className="text-sm text-brown-soft mt-1">{h.descripcion}</p>}
                    {h.proxima_dosis && (
                      <p className="text-xs text-terracotta mt-2">Próxima dosis: {formatDate(h.proxima_dosis)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4 sm:p-6 mb-6 bg-cream-100">
            <h3 className="font-semibold mb-2">Proceso de adopción</h3>
            <ol className="text-sm text-brown-soft space-y-1 list-decimal list-inside">
              <li>Completa el formulario de solicitud</li>
              <li>Revisión por nuestro equipo (3-5 días)</li>
              <li>Visita de conocimiento</li>
              <li>¡Bienvenido a la familia!</li>
            </ol>
          </div>

          {mascota.estado === 'disponible' && (
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                const adoptPath = tenantPath(`adoptar/${mascota.id}`);
                if (!isAuthenticated) {
                  navigate(tenantPath('login'), { state: { from: { pathname: adoptPath } } });
                  return;
                }
                navigate(adoptPath);
              }}
            >
              Solicitar adopción
            </Button>
          )}

          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="mt-4 flex items-center gap-2 text-sm text-brown-soft hover:text-terracotta transition"
          >
            <QrCode className="w-4 h-4" />
            Compartir ficha con QR
          </button>
        </div>
      </div>

      {qrOpen && slug && (
        <MascotaQrModal
          mascota={mascota}
          slug={slug}
          onClose={() => setQrOpen(false)}
        />
      )}
    </div>
  );
}
