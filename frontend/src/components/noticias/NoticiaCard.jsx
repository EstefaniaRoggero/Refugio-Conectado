import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { getImageUrl } from '../../utils/helpers';
import { NoticiaBadges, NoticiaDatos } from './NoticiaInfo';
import NoticiaModal from './NoticiaModal';

export default function NoticiaCard({ noticia }) {
  const [abierta, setAbierta] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="card overflow-hidden flex flex-col w-full h-full text-left group transition hover:shadow-card"
      >
        {noticia.imagen && (
          <div className="relative aspect-[16/9] w-full bg-cream-100 overflow-hidden">
            <img
              src={getImageUrl(noticia.imagen)}
              alt={noticia.titulo}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-4 sm:p-5 flex flex-col flex-1 w-full">
          <NoticiaBadges noticia={noticia} />
          <h3 className="font-bold text-lg text-brown-dark break-words">{noticia.titulo}</h3>
          <NoticiaDatos noticia={noticia} />
          <span className="mt-auto pt-3 inline-flex items-center gap-1 text-sm font-medium text-terracotta">
            Ver más <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </button>
      {abierta && <NoticiaModal noticia={noticia} onClose={() => setAbierta(false)} />}
    </>
  );
}
