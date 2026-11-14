import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import NoticiaCard from './NoticiaCard';

const INTERVALO_MS = 6000;
const COPIAS = 3;

export default function NoticiasCarrusel({ noticias }) {
  const pistaRef = useRef(null);
  const finScrollRef = useRef(null);
  const [activa, setActiva] = useState(0);
  const [pausado, setPausado] = useState(false);
  const total = noticias.length;
  const slides = Array.from({ length: COPIAS }, (_, copia) => noticias.map((n) => ({ ...n, copia }))).flat();

  const medidas = useCallback(() => {
    const pista = pistaRef.current;
    if (!pista || pista.children.length <= total) return null;
    const paso = pista.children[1].offsetLeft - pista.children[0].offsetLeft;
    return { pista, paso, anchoTanda: paso * total };
  }, [total]);

  useLayoutEffect(() => {
    const m = medidas();
    if (m) m.pista.scrollLeft = m.anchoTanda;
  }, [medidas]);

  const recentrar = useCallback(() => {
    const m = medidas();
    if (!m) return;
    const { pista, anchoTanda } = m;
    if (pista.scrollLeft < anchoTanda * 0.5) pista.scrollLeft += anchoTanda;
    else if (pista.scrollLeft >= anchoTanda * 1.5) pista.scrollLeft -= anchoTanda;
  }, [medidas]);

  const alDesplazar = () => {
    const m = medidas();
    if (!m) return;
    const indice = Math.round(m.pista.scrollLeft / m.paso);
    setActiva(((indice % total) + total) % total);
    clearTimeout(finScrollRef.current);
    finScrollRef.current = setTimeout(recentrar, 150);
  };

  useEffect(() => () => clearTimeout(finScrollRef.current), []);

  const mover = useCallback((direccion) => {
    const m = medidas();
    if (!m) return;
    m.pista.scrollBy({ left: direccion * m.paso, behavior: 'smooth' });
  }, [medidas]);

  const irA = (index) => {
    const m = medidas();
    if (!m) return;
    m.pista.scrollTo({ left: m.anchoTanda + index * m.paso, behavior: 'smooth' });
  };

  useEffect(() => {
    if (pausado) return undefined;
    const id = setInterval(() => mover(1), INTERVALO_MS);
    return () => clearInterval(id);
  }, [pausado, mover]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={() => setPausado(true)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div
        ref={pistaRef}
        onScroll={alDesplazar}
        className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-roledescription="carrusel"
      >
        {slides.map((n) => (
          <div
            key={`${n.copia}-${n.id}`}
            className="snap-start shrink-0 w-[85%] sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
          >
            <NoticiaCard noticia={n} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => mover(-1)}
        className="hidden sm:flex absolute left-0 top-1/3 -translate-x-1/2 w-10 h-10 rounded-full bg-warm-white shadow-card items-center justify-center text-brown-dark hover:text-terracotta transition"
        aria-label="Novedad anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => mover(1)}
        className="hidden sm:flex absolute right-0 top-1/3 translate-x-1/2 w-10 h-10 rounded-full bg-warm-white shadow-card items-center justify-center text-brown-dark hover:text-terracotta transition"
        aria-label="Novedad siguiente"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="flex justify-center gap-2 mt-4">
        {noticias.map((n, i) => (
          <button
            key={n.id}
            type="button"
            onClick={() => irA(i)}
            className={`h-2 rounded-full transition-all ${i === activa ? 'w-6 bg-terracotta' : 'w-2 bg-cream-200 hover:bg-terracotta/40'}`}
            aria-label={`Ir a la novedad ${i + 1}`}
            aria-current={i === activa}
          />
        ))}
      </div>
    </div>
  );
}
