import { Link } from 'react-router-dom';
import { AlertTriangle, Syringe, Heart, Megaphone, Scissors } from 'lucide-react';
import { getImageUrl } from '../../utils/helpers';
import useTenantPath from '../../hooks/useTenantPath';

const TIPO_ICON = {
  dias_sin_adopcion: Heart,
  difusion: Megaphone,
  esterilizacion: Scissors,
  vacuna: Syringe,
};

const SEVERIDAD_STYLE = {
  critica: 'border-red-300 bg-red-50 dark:bg-red-950/30',
  alta: 'border-orange-300 bg-orange-50 dark:bg-orange-950/20',
  media: 'border-amber-300 bg-amber-50 dark:bg-amber-950/20',
};

const SEVERIDAD_BADGE = {
  critica: 'bg-red-500 text-white',
  alta: 'bg-orange-500 text-white',
  media: 'bg-amber-500 text-white',
};

const SEVERIDAD_LABEL = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Media',
};

export default function AdminUrgencyPanel({ urgencia }) {
  const tenantPath = useTenantPath();
  const alertas = urgencia?.alertas || [];
  const resumen = urgencia?.resumen || { total: 0, criticas: 0, altas: 0, medias: 0 };

  if (!alertas.length) {
    return (
      <div className="card p-4 sm:p-6 mb-5 sm:mb-8 border-l-4 border-l-green-500">
        <p className="font-semibold text-brown-dark">Sin alertas de urgencia</p>
        <p className="text-sm text-brown-soft mt-1">
          No hay casos críticos detectados en las mascotas activas del refugio.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4 sm:p-6 mb-5 sm:mb-8">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-brown-dark flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-terracotta" />
            Detector de urgencia
          </h2>
          <p className="text-xs sm:text-sm text-brown-soft mt-1">
            Casos que requieren atención o difusión prioritaria.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {resumen.criticas > 0 && (
            <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
              {resumen.criticas} crítica{resumen.criticas !== 1 ? 's' : ''}
            </span>
          )}
          {resumen.altas > 0 && (
            <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
              {resumen.altas} alta{resumen.altas !== 1 ? 's' : ''}
            </span>
          )}
          {resumen.medias > 0 && (
            <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">
              {resumen.medias} media{resumen.medias !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <ul className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto pr-1">
        {alertas.map((a, i) => {
          const Icon = TIPO_ICON[a.tipo] || AlertTriangle;
          return (
            <li
              key={`${a.id_mascota}-${a.tipo}-${a.severidad}-${i}`}
              className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border ${SEVERIDAD_STYLE[a.severidad]}`}
            >
              <img
                src={getImageUrl(a.imagen)}
                alt=""
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-brown-dark">{a.nombre}</span>
                  <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded font-bold ${SEVERIDAD_BADGE[a.severidad]}`}>
                    {SEVERIDAD_LABEL[a.severidad]}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-brown-soft flex items-start gap-1.5">
                  <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {a.mensaje}
                </p>
                <Link
                  to={tenantPath(`mascotas/${a.id_mascota}`)}
                  className="text-xs text-terracotta font-medium hover:underline mt-1 inline-block"
                >
                  Ver ficha →
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
