import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getImageUrl } from '../../utils/helpers';
import useTenantPath from '../../hooks/useTenantPath';

export default function RecomendacionCard({ mascota, index = 0 }) {
  const tenantPath = useTenantPath();
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="card overflow-hidden"
    >
      <div className="relative w-full h-44 sm:h-56">
        <img
          src={getImageUrl(mascota.imagen)}
          alt={mascota.nombre}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {mascota.puntuacion != null && (
          <span className="absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full bg-warm-white/95 text-terracotta font-medium flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            {mascota.puntuacion}% compatible
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="text-lg sm:text-xl font-semibold text-brown-dark">{mascota.nombre}</h3>
          <span className="text-xs capitalize px-2.5 py-0.5 rounded-full bg-cream-200 text-brown-soft">
            {mascota.tipo}
          </span>
          {mascota.tamano && (
            <span className="text-xs capitalize text-brown-soft">· {mascota.tamano}</span>
          )}
        </div>

        {mascota.razon && (
          <p className="text-sm text-brown-dark mb-2 leading-relaxed">{mascota.razon}</p>
        )}
        {mascota.consideraciones && (
          <p className="text-sm text-brown-soft italic mb-4 leading-relaxed">{mascota.consideraciones}</p>
        )}

        <Link
          to={tenantPath(`mascotas/${mascota.id}`)}
          className="inline-flex items-center gap-2 text-terracotta font-medium hover:gap-3 transition-all"
        >
          Ver ficha y adoptar <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.article>
  );
}
