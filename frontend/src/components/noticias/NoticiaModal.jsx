import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { getImageUrl } from '../../utils/helpers';
import { NoticiaBadges, NoticiaDatos } from './NoticiaInfo';

export default function NoticiaModal({ noticia, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={noticia.titulo}
    >
      <div
        className="relative w-full sm:max-w-3xl max-h-[92dvh] sm:max-h-[90dvh] overflow-y-auto bg-warm-white rounded-t-3xl sm:rounded-3xl shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {noticia.imagen && (
          <div className="relative bg-brown-dark/90 overflow-hidden">
            <img
              src={getImageUrl(noticia.imagen)}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50"
            />
            <img
              src={getImageUrl(noticia.imagen)}
              alt={noticia.titulo}
              className="relative w-full max-h-[55dvh] object-contain"
            />
          </div>
        )}

        <div className="p-5 sm:p-7">
          <NoticiaBadges noticia={noticia} />
          <h2 className="text-xl sm:text-2xl font-bold text-brown-dark break-words">{noticia.titulo}</h2>
          <NoticiaDatos noticia={noticia} />
          <p className="mt-4 text-brown-dark break-words whitespace-pre-line leading-relaxed">{noticia.contenido}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
