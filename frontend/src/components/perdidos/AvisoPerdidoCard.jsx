import { useEffect, useState } from 'react';
import { MapPin, Calendar, MessageCircle, Maximize2, X } from 'lucide-react';
import { getImageUrl } from '../../utils/helpers';
import {
  AVISO_TIPO_LABEL,
  AVISO_TIPO_COLOR,
  buildWhatsAppLink,
  formatFechaAviso,
} from '../../constants/perdidos';

const especieLabel = { perro: 'Perro', gato: 'Gato', otro: 'Mascota' };

export default function AvisoPerdidoCard({ aviso, refugioNombre }) {
  const [fotoActiva, setFotoActiva] = useState(0);
  const [verGrande, setVerGrande] = useState(false);
  const imagenes = aviso.imagenes || [];
  const fotoUrl = imagenes[fotoActiva]?.url ? getImageUrl(imagenes[fotoActiva].url) : null;

  useEffect(() => {
    if (!verGrande) return undefined;
    const onKey = (e) => e.key === 'Escape' && setVerGrande(false);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener('keydown', onKey);
    };
  }, [verGrande]);
  const titulo = aviso.nombre_mascota || especieLabel[aviso.especie];
  const mensaje = aviso.tipo === 'perdido'
    ? `Hola ${aviso.contacto_nombre}, vi el aviso de ${titulo} en ${refugioNombre || 'Refugio Conectado'}. Tengo información.`
    : `Hola ${aviso.contacto_nombre}, vi el aviso de la mascota que encontraste en ${refugioNombre || 'Refugio Conectado'}. Creo que puede ser mía.`;
  const waLink = buildWhatsAppLink(aviso.contacto_telefono, mensaje);

  return (
    <article className="card flex flex-col">
      <div className="relative aspect-[4/3] bg-cream-100 overflow-hidden">
        {fotoUrl && (
          <img
            src={fotoUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60"
          />
        )}
        <button
          type="button"
          onClick={() => fotoUrl && setVerGrande(true)}
          className="relative w-full h-full cursor-zoom-in"
          aria-label={`Ver foto de ${titulo} en grande`}
        >
          <img
            src={fotoUrl}
            alt={titulo}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </button>
        <span className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/40 text-white pointer-events-none">
          <Maximize2 className="w-3.5 h-3.5" />
        </span>
        <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${AVISO_TIPO_COLOR[aviso.tipo]}`}>
          {AVISO_TIPO_LABEL[aviso.tipo]}
        </span>
        {imagenes.length > 1 && (
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
            {imagenes.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setFotoActiva(i)}
                className={`w-2.5 h-2.5 rounded-full ${i === fotoActiva ? 'bg-white' : 'bg-white/50'}`}
                aria-label={`Ver foto ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold text-brown-dark truncate">{titulo}</h3>
          <span className="text-sm text-brown-soft shrink-0">{especieLabel[aviso.especie]}</span>
        </div>
        <div className="space-y-1 text-sm text-brown-soft mb-3">
          <p className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-terracotta shrink-0" />
            <span className="truncate">{aviso.zona}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-terracotta shrink-0" />
            {aviso.tipo === 'perdido' ? 'Se perdió el' : 'Encontrado el'} {formatFechaAviso(aviso.fecha_evento)}
          </p>
          {aviso.tipo === 'encontrado' && aviso.resguardado !== null && (
            <p className="text-xs font-medium text-brown-dark">
              {aviso.resguardado ? 'Está resguardado' : 'Sigue en la calle'}
            </p>
          )}
        </div>
        <p className="text-sm text-brown-soft line-clamp-3 mb-4 break-words">{aviso.descripcion}</p>

        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#25D366] text-white font-medium hover:bg-[#20bd5a] transition"
          >
            <MessageCircle className="w-4 h-4" />
            Contactar a {aviso.contacto_nombre.split(' ')[0]}
          </a>
        )}
      </div>

      {verGrande && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-3 sm:p-8"
          onClick={() => setVerGrande(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Foto de ${titulo}`}
        >
          <button
            type="button"
            onClick={() => setVerGrande(false)}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/15 text-white hover:bg-white/25"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fotoUrl}
            alt={titulo}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {imagenes.length > 1 && (
            <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
              {imagenes.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setFotoActiva(i)}
                  className={`w-3 h-3 rounded-full ${i === fotoActiva ? 'bg-white' : 'bg-white/40'}`}
                  aria-label={`Ver foto ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
