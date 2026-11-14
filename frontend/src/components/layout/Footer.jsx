import { Facebook, Instagram, Linkedin, PawPrint } from 'lucide-react';
import { Link } from 'react-router-dom';
import ContactInfo from '../shared/ContactInfo';
import ChangeRefugioLink from './ChangeRefugioLink';
import useTenantStore from '../../context/tenantStore';
import useTenantPath from '../../hooks/useTenantPath';

const socialLinks = [
  { label: 'Instagram', icon: Instagram, url: import.meta.env.VITE_INSTAGRAM_URL },
  { label: 'Facebook', icon: Facebook, url: import.meta.env.VITE_FACEBOOK_URL },
  { label: 'LinkedIn', icon: Linkedin, url: import.meta.env.VITE_LINKEDIN_URL },
].filter((item) => item.url);

export default function Footer() {
  const { refugio } = useTenantStore();
  const tenantPath = useTenantPath();
  const siteTitle = refugio?.nombre || 'Refugio Conectado';
  const homePath = tenantPath();

  return <footer className="bg-brown-dark text-cream-100">
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid gap-7 items-start"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}
    >
      <div id="softbyte" className="scroll-mt-24">
        <a href={`${homePath}#inicio`} className="flex items-center gap-2 mb-4 w-fit">
          <span className="w-10 h-10 rounded-xl bg-terracotta/20 flex items-center justify-center"><PawPrint className="w-6 h-6 text-orange-pastel" /></span>
          <span className="text-xl font-semibold text-warm-white">{siteTitle}</span>
        </a>
        <p className="text-cream-200 max-w-sm leading-relaxed text-sm">Tecnología para centralizar la gestión de refugios, simplificar adopciones y conectar a quienes quieren ayudar.</p>
        <div className="mt-4">
          <p className="text-sm text-cream-200">Desarrollado por <span className="font-semibold text-orange-pastel">SoftByte</span>.</p>
          {socialLinks.length ? <div className="flex gap-2 mt-3">{socialLinks.map(({ label, icon: Icon, url }) => <a key={label} href={url} target="_blank" rel="noreferrer" aria-label={label} className="w-8 h-8 rounded-lg border border-brown-soft/50 flex items-center justify-center text-cream-200 hover:text-orange-pastel hover:border-orange-pastel transition"><Icon className="w-4 h-4" /></a>)}</div> : <p className="text-xs text-cream-200/70 mt-2">Instagram · Facebook · LinkedIn</p>}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-warm-white mb-4">Producto</h4>
        <ul className="space-y-3 text-sm text-cream-200">
          <li><a href={`${homePath}#inicio`} className="hover:text-orange-pastel transition">Inicio</a></li>
          <li><a href={`${homePath}#como-funciona`} className="hover:text-orange-pastel transition">Cómo funciona</a></li>
          <li><a href={`${homePath}#planes`} className="hover:text-orange-pastel transition">Planes</a></li>
          <li><ChangeRefugioLink className="hover:text-orange-pastel transition inline-flex items-center gap-1.5" /></li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-warm-white mb-4">Refugio Conectado</h4>
        <ul className="space-y-3 text-sm text-cream-200">
          <li><a href={`${homePath}#funcionalidades`} className="hover:text-orange-pastel transition">Funcionalidades</a></li>
          <li><a href={`${homePath}#softbyte`} className="hover:text-orange-pastel transition">Nosotros</a></li>
          <li><Link to={tenantPath('perdidos')} className="hover:text-orange-pastel transition">Perdidos y encontrados</Link></li>
          <li><Link to={tenantPath('novedades')} className="hover:text-orange-pastel transition">Novedades</Link></li>
          <li><Link to={tenantPath('contacto')} className="hover:text-orange-pastel transition">Contacto</Link></li>
          <li><a href={`${homePath}#demo`} className="hover:text-orange-pastel transition">Solicitar demo</a></li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-warm-white mb-4">Contacto</h4>
        <ContactInfo size="sm" variant="footer" />
      </div>
    </div>
    <div className="border-t border-brown-soft/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left text-xs text-cream-200">
        <p>© {new Date().getFullYear()} {siteTitle}. Todos los derechos reservados.</p>
        <p>Diseñado y desarrollado por SoftByte.</p>
      </div>
    </div>
  </footer>;
}
