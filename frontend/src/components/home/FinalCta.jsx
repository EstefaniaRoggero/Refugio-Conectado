import { ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import useTenantPath from '../../hooks/useTenantPath';

export default function FinalCta() {
  const tenantPath = useTenantPath();
  const contactPath = tenantPath('contacto');
  return <section id="demo" className="scroll-mt-24 px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
    <div className="max-w-7xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-brown-dark via-brown to-terracotta-dark px-6 py-12 sm:px-12 sm:py-16 text-center text-warm-white shadow-card">
      <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-orange-soft/10" />
      <div className="absolute -bottom-28 -left-16 w-72 h-72 rounded-full bg-terracotta-light/10" />
      <div className="relative max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold leading-tight">¿Listos para transformar la gestión de tu refugio?</h2>
        <p className="text-cream-200 text-base sm:text-lg mt-4">Descubrí cómo Refugio Conectado puede ayudar a tu organización a trabajar de manera más simple, organizada y conectada.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
          <Link to={`${contactPath}?motivo=demo`} className="btn-primary">Solicitar una demo <ArrowRight className="w-4 h-4" /></Link>
          <Link to={contactPath} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-cream-100/50 text-cream-50 font-medium hover:bg-warm-white hover:text-brown-dark transition"><MessageCircle className="w-4 h-4" /> Contactarnos</Link>
        </div>
      </div>
    </div>
  </section>;
}
