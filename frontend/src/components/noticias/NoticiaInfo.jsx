import { Calendar, Clock, MapPin, Star } from 'lucide-react';
import { formatFechaAviso } from '../../constants/perdidos';
import { NOTICIA_TIPO_COLOR, NOTICIA_TIPO_LABEL } from '../../constants/noticias';

export function NoticiaBadges({ noticia }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${NOTICIA_TIPO_COLOR[noticia.tipo]}`}>
        {NOTICIA_TIPO_LABEL[noticia.tipo]}
      </span>
      {Boolean(noticia.destacada) && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-terracotta/10 text-terracotta">
          <Star className="w-3 h-3" /> Destacada
        </span>
      )}
    </div>
  );
}

export function NoticiaDatos({ noticia }) {
  if (!noticia.fecha_evento && !noticia.horario && !noticia.lugar) return null;
  return (
    <div className="mt-2 space-y-1 text-sm text-brown-soft">
      {noticia.fecha_evento && (
        <p className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 shrink-0" /> {formatFechaAviso(noticia.fecha_evento)}
        </p>
      )}
      {noticia.horario && (
        <p className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 shrink-0" /> {noticia.horario}
        </p>
      )}
      {noticia.lugar && (
        <p className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 shrink-0" /> <span className="break-words">{noticia.lugar}</span>
        </p>
      )}
    </div>
  );
}
