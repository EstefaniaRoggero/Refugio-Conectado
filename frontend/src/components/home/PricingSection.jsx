import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import useTenantPath from '../../hooks/useTenantPath';

// El plan anual equivale a 10 meses (2 meses bonificados).
export const PLAN_PRICES = {
  esencial: { monthly: 'USD 39 / mes', annual: 'USD 390 / año' },
  conectado: { monthly: 'USD 89 / mes', annual: 'USD 890 / año' },
  institucional: { monthly: 'Consultar', annual: 'Consultar' },
};

const plans = [
  {
    id: 'esencial',
    name: 'Plan Esencial',
    description: 'Para refugios pequeños que quieren comenzar a digitalizar su gestión.',
    features: ['Gestión de mascotas', 'Solicitudes de adopción', 'Registro de adoptantes', 'Panel administrativo', 'Gestión básica de voluntarios', 'Estadísticas básicas', 'Soporte'],
    cta: 'Comenzar',
  },
  {
    id: 'conectado',
    name: 'Plan Conectado',
    description: 'Para refugios que necesitan una gestión más completa.',
    featured: true,
    features: ['Todo lo del Plan Esencial', 'Recomendador inteligente con IA', 'Luna, asistente inteligente', 'Gestión completa de voluntariado', 'Donaciones y campañas', 'Estadísticas avanzadas', 'Mayor capacidad', 'Personalización del refugio', 'Soporte prioritario'],
    cta: 'Elegir Plan Conectado',
  },
  {
    id: 'institucional',
    name: 'Plan Institucional',
    description: 'Para municipios, grandes organizaciones o instituciones con varios refugios.',
    features: ['Todo lo incluido en los planes anteriores', 'Gestión de múltiples refugios', 'Administración centralizada', 'Usuarios y roles administrativos', 'Reportes y métricas por refugio', 'Personalización institucional', 'Integraciones específicas', 'Soporte personalizado', 'Convenios con veterinarias e instituciones'],
    cta: 'Contactar a SoftByte',
  },
];

export default function PricingSection() {
  const [billing, setBilling] = useState('monthly');
  const tenantPath = useTenantPath();
  const contactPath = tenantPath('contacto');

  return <section id="planes" className="scroll-mt-24 py-16 sm:py-24 bg-cream-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-terracotta/10 text-terracotta text-sm font-medium"><Sparkles className="w-4 h-4" /> Planes flexibles</span>
        <h2 className="section-title mt-5 mb-3">Un plan para cada refugio</h2>
        <p className="section-subtitle mx-auto">Elegí la opción que mejor se adapte al tamaño y las necesidades de tu organización.</p>
        <div className="inline-flex mt-7 p-1 rounded-2xl bg-warm-white border border-cream-200 shadow-soft" role="group" aria-label="Período de facturación">
          <button type="button" onClick={() => setBilling('monthly')} className={`px-5 py-2 rounded-xl text-sm font-medium transition ${billing === 'monthly' ? 'bg-terracotta text-white shadow-soft' : 'text-brown-soft hover:text-terracotta'}`} aria-pressed={billing === 'monthly'}>Mensual</button>
          <button type="button" onClick={() => setBilling('annual')} className={`px-5 py-2 rounded-xl text-sm font-medium transition ${billing === 'annual' ? 'bg-terracotta text-white shadow-soft' : 'text-brown-soft hover:text-terracotta'}`} aria-pressed={billing === 'annual'}>Anual</button>
        </div>
        {billing === 'annual' && <p className="text-sm text-terracotta font-medium mt-3">Ahorrá 2 meses contratando el plan anual</p>}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-7 mt-12 items-stretch">
        {plans.map((plan, index) => <motion.article key={plan.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.08 }} whileHover={{ y: -5 }} className={`relative rounded-3xl p-6 sm:p-7 flex flex-col ${plan.featured ? 'bg-brown-dark text-warm-white shadow-card ring-2 ring-terracotta lg:-translate-y-3' : 'bg-warm-white text-brown-dark border border-cream-200 shadow-soft'}`}>
          {plan.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-terracotta text-white text-xs font-semibold shadow-soft whitespace-nowrap">Más elegido</span>}
          <h3 className="text-xl font-bold mt-2">{plan.name}</h3>
          <p className={`text-sm mt-3 min-h-16 ${plan.featured ? 'text-cream-200' : 'text-brown-soft'}`}>{plan.description}</p>
          <p className="text-3xl font-bold mt-5 mb-6">{PLAN_PRICES[plan.id][billing]}</p>
          <ul className="space-y-3 flex-1 mb-7">
            {plan.features.map((feature) => <li key={feature} className={`flex items-start gap-2.5 text-sm ${plan.featured ? 'text-cream-100' : 'text-brown-soft'}`}><span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.featured ? 'bg-terracotta/30 text-orange-pastel' : 'bg-terracotta/10 text-terracotta'}`}><Check className="w-3.5 h-3.5" /></span>{feature}</li>)}
          </ul>
          <Link to={`${contactPath}?plan=${plan.id}`} className={plan.featured ? 'btn-primary w-full' : 'btn-outline w-full'}>{plan.cta}</Link>
        </motion.article>)}
      </div>

      <div className="mt-10 sm:mt-14 rounded-3xl bg-warm-white border border-cream-200 shadow-soft p-6 sm:p-9 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div><h3 className="text-xl sm:text-2xl font-bold">¿Necesitás algo diferente?</h3><p className="text-brown-soft mt-2">Podemos adaptar Refugio Conectado a las necesidades específicas de tu organización.</p></div>
        <Link to={`${contactPath}?plan=personalizado`} className="btn-secondary shrink-0">Solicitar un plan personalizado</Link>
      </div>
    </div>
  </section>;
}
