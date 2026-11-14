import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Shield, Users, ArrowRight, Star, Siren, Megaphone } from 'lucide-react';
import api from '../services/api';
import MascotaCard from '../components/mascotas/MascotaCard';
import Button from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';
import useRequireAuthNavigate from '../hooks/useRequireAuthNavigate';
import useAsyncData from '../hooks/useAsyncData';
import useTenantPath from '../hooks/useTenantPath';
import useTenantStore from '../context/tenantStore';
import PricingSection from '../components/home/PricingSection';
import FinalCta from '../components/home/FinalCta';
import NoticiaCard from '../components/noticias/NoticiaCard';
import NoticiasCarrusel from '../components/noticias/NoticiasCarrusel';

const stats = [
  { value: '500+', label: 'Adopciones exitosas' },
  { value: '120', label: 'Mascotas en refugio' },
  { value: '80+', label: 'Voluntarios activos' },
  { value: '$50M+', label: 'Recaudado en donaciones' },
];

const pasos = [
  { num: '01', title: 'Explora', desc: 'Navega nuestro catálogo o usa el recomendador inteligente.' },
  { num: '02', title: 'Conoce', desc: 'Visita al refugio y conoce a tu posible compañero.' },
  { num: '03', title: 'Solicita', desc: 'Completa el formulario de adopción responsable.' },
  { num: '04', title: 'Adopta', desc: 'Te acompañamos en la transición a tu nuevo hogar.' },
];

const testimonios = [
  { nombre: 'Carolina M.', texto: 'Adoptamos a Luna hace 6 meses. Ha transformado nuestra familia por completo.', rating: 5 },
  { nombre: 'Andrés P.', texto: 'El proceso fue transparente y el equipo del refugio muy profesional.', rating: 5 },
  { nombre: 'Sofía R.', texto: 'Gracias por ayudarnos a encontrar al compañero perfecto para nuestro departamento.', rating: 5 },
];

export default function Home() {
  const { data: destacadas = [], loading } = useAsyncData(
    () => api.get('/mascotas', { params: { destacada: true, limit: 3 } })
      .then(({ data }) => data.data.mascotas)
      .catch(() => []),
    []
  );
  const { data: noticias = [] } = useAsyncData(
    () => api.get('/noticias', { params: { limit: 8 } })
      .then(({ data }) => data.data.noticias)
      .catch(() => []),
    []
  );
  const requireAuth = useRequireAuthNavigate();
  const tenantPath = useTenantPath();
  const { refugio } = useTenantStore();

  return (
    <>
      <section id="inicio" className="scroll-mt-24 relative overflow-hidden bg-gradient-to-br from-cream-100 via-warm-white to-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-32 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-orange-soft/50 text-terracotta text-sm font-medium mb-4 sm:mb-6">
              Adopción responsable
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-brown-dark leading-tight mb-4 sm:mb-6">
              Encuentra al compañero que <span className="text-terracotta">cambiará tu vida</span>
            </h1>
            <p className="text-base sm:text-lg text-brown-soft mb-6 sm:mb-8 max-w-lg">
              En {refugio?.nombre || 'Refugio Conectado'} conectamos familias amorosas con mascotas que buscan un hogar. Cada adopción salva dos vidas.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
              <Button className="col-span-2" onClick={() => requireAuth('/mascotas')}>Adoptar ahora</Button>
              <Button variant="outline" onClick={() => requireAuth('/donar')}>Donar</Button>
              <Button variant="secondary" onClick={() => requireAuth('/voluntariado')}>Ser voluntario</Button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative hidden lg:block"
          >
            <img
              src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=700"
              alt="Mascota feliz"
              className="rounded-3xl shadow-card w-full object-cover aspect-[4/3]"
            />
            <div className="absolute -bottom-6 -left-6 card p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-terracotta/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-terracotta" />
              </div>
              <div>
                <p className="font-semibold text-brown-dark">+500 familias felices</p>
                <p className="text-sm text-brown-soft">Adopciones exitosas</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-red-50 border-y border-red-100">
        <Link
          to={tenantPath('perdidos')}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3 sm:gap-4 group"
        >
          <span className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
            <Siren className="w-5 h-5 sm:w-6 sm:h-6" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-semibold text-red-700">¿Se perdió tu mascota o encontraste una?</span>
            <span className="block text-sm text-red-700/80">Envianos una foto y lo publicamos para ayudar a que vuelva a casa.</span>
          </span>
          <ArrowRight className="w-5 h-5 text-red-600 shrink-0 group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>

      {noticias?.length > 0 && (
        <section className="py-10 sm:py-14 bg-cream-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center">
                  <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-brown-dark">Novedades del refugio</h2>
                  <p className="text-sm text-brown-soft">Campañas, eventos y lo que está pasando ahora</p>
                </div>
              </div>
              <Link to={tenantPath('novedades')} className="inline-flex items-center gap-1 text-sm font-medium text-terracotta hover:underline">
                Ver todas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {noticias.length > 2 ? (
              <NoticiasCarrusel noticias={noticias} />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {noticias.map((n) => <NoticiaCard key={n.id} noticia={n} />)}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="py-10 sm:py-16 bg-warm-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-terracotta">{s.value}</p>
              <p className="text-sm sm:text-base text-brown-soft mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="funcionalidades" className="scroll-mt-24 py-12 sm:py-20 max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end gap-4 mb-6 sm:mb-10">
          <div>
            <h2 className="section-title mb-2">Mascotas destacadas</h2>
            <p className="section-subtitle">Conoce a quienes esperan su hogar definitivo</p>
          </div>
          <Link to={tenantPath('mascotas')} className="flex shrink-0 items-center gap-1 text-sm sm:text-base text-terracotta font-medium hover:gap-2 transition-all">
            Ver todas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading ? [1, 2, 3].map((i) => <SkeletonCard key={i} />) : destacadas.map((m, i) => <MascotaCard key={m.id} mascota={m} index={i} />)}
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-24 py-12 sm:py-20 bg-cream-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="section-title text-center mb-4">¿Cómo funciona?</h2>
          <p className="section-subtitle text-center mx-auto mb-8 sm:mb-12">Un proceso simple, transparente y humano</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {pasos.map((p, i) => (
              <motion.div
                key={p.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-4 sm:p-6"
              >
                <span className="text-3xl sm:text-4xl font-bold text-terracotta/30">{p.num}</span>
                <h3 className="text-lg sm:text-xl font-semibold mt-1 sm:mt-2 mb-1 sm:mb-2">{p.title}</h3>
                <p className="text-brown-soft text-sm">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4">
        <h2 className="section-title text-center mb-8 sm:mb-12">Beneficios de adoptar</h2>
        <div className="grid md:grid-cols-3 gap-4 sm:gap-8">
          {[
            { icon: Heart, title: 'Salvas una vida', desc: 'Cada adopción libera espacio para rescatar otro animal.' },
            { icon: Shield, title: 'Mascota evaluada', desc: 'Todas reciben atención veterinaria, vacunas y seguimiento.' },
            { icon: Users, title: 'Acompañamiento', desc: 'Te guiamos antes, durante y después de la adopción.' },
          ].map((b, i) => (
            <motion.div key={b.title} whileHover={{ y: -4 }} className="card p-5 sm:p-8 flex items-start gap-4 text-left md:block md:text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 md:mx-auto rounded-2xl bg-terracotta/10 flex items-center justify-center md:mb-4">
                <b.icon className="w-7 h-7 text-terracotta" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1 md:mb-2">{b.title}</h3>
                <p className="text-brown-soft text-sm">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-20 bg-brown-dark text-cream-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Historias reales</h2>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {testimonios.map((t) => (
              <div key={t.nombre} className="bg-brown-soft/30 rounded-2xl p-5 sm:p-6 border border-brown-soft/20">
                <div className="flex gap-1 mb-3">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-orange-pastel text-orange-pastel" />)}
                </div>
                <p className="text-cream-200 mb-4">&ldquo;{t.texto}&rdquo;</p>
                <p className="font-medium text-warm-white">{t.nombre}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />
      <FinalCta />
    </>
  );
}
