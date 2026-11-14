import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';
import { getImageUrl, estadoMascotaLabel, esMascotaLargaEspera } from '../../utils/helpers';
import useAuthStore from '../../context/authStore';
import api from '../../services/api';
import { showSuccess } from '../../utils/alerts';

import useTenantPath from '../../hooks/useTenantPath';

export default function MascotaCard({ mascota, index = 0, onFavoriteToggle }) {
  const { isAuthenticated } = useAuthStore();
  const tenantPath = useTenantPath();

  const toggleFavorito = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    try {
      const { data } = await api.post('/favoritos/toggle', { mascota_id: mascota.id });
      showSuccess(data.message);
      onFavoriteToggle?.();
    } catch {
      /* handled by interceptor */
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card group hover:shadow-card transition-shadow duration-300"
    >
      <div className="relative h-48 sm:h-52 overflow-hidden">
        <img
          src={getImageUrl(mascota.imagen)}
          alt={mascota.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium bg-warm-white/90 text-terracotta">
          {estadoMascotaLabel[mascota.estado] || mascota.estado}
        </span>
        {esMascotaLargaEspera(mascota.dias_en_refugio) && mascota.estado !== 'adoptado' && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-medium bg-terracotta/90 text-white shadow-sm">
            Lleva tiempo esperando
          </span>
        )}
        {isAuthenticated && (
          <button
            onClick={toggleFavorito}
            className="absolute top-3 right-3 p-2 rounded-full bg-warm-white/90 hover:bg-terracotta hover:text-white transition"
            aria-label="Agregar a favoritos"
          >
            <Heart className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="text-lg sm:text-xl font-semibold text-brown-dark truncate">{mascota.nombre}</h3>
          <span className="text-sm text-brown-soft capitalize shrink-0">{mascota.tipo}</span>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1 mb-3 sm:mb-4 text-sm text-brown-soft">
          <span>{mascota.edad} {mascota.edad_unidad || 'años'}</span>
          <span>•</span>
          <span className="capitalize">{mascota.tamano}</span>
          <span>•</span>
          <span className="capitalize">{mascota.sexo}</span>
        </div>
        <p className="text-sm text-brown-soft line-clamp-2 mb-3 sm:mb-4">{mascota.descripcion}</p>
        <Link
          to={tenantPath(`mascotas/${mascota.id}`)}
          className="inline-flex items-center gap-2 text-terracotta font-medium hover:gap-3 transition-all"
        >
          Ver detalle <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.article>
  );
}
