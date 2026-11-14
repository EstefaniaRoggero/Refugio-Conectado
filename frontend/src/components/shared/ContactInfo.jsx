import { Mail, MapPin, Phone } from 'lucide-react';
import useTenantStore from '../../context/tenantStore';
import { CONTACT_INFO } from '../../constants/site';

const sizes = {
  sm: { icon: 'w-4 h-4', gap: 'gap-2' },
  md: { icon: 'w-5 h-5', gap: 'gap-3' },
};

const variants = {
  default: 'space-y-4 text-brown-soft',
  footer: 'space-y-3 text-cream-200 text-sm',
};

export default function ContactInfo({ size = 'md', variant = 'default', className = '' }) {
  const { refugio } = useTenantStore();
  const s = sizes[size] || sizes.md;
  const listClass = variants[variant] || variants.default;

  const info = {
    address: refugio?.direccion || refugio?.ciudad || CONTACT_INFO.address,
    phone: refugio?.telefono || CONTACT_INFO.phone,
    email: refugio?.email || CONTACT_INFO.email,
  };

  return (
    <ul className={`${listClass} ${className}`}>
      <li className={`flex items-center ${s.gap}`}>
        <MapPin className={`${s.icon} text-terracotta shrink-0`} />
        <span className="min-w-0 break-words">{info.address}</span>
      </li>
      <li className={`flex items-center ${s.gap}`}>
        <Phone className={`${s.icon} text-terracotta shrink-0`} />
        <a href={`tel:${String(info.phone).replace(/[^\d+]/g, '')}`} className="min-w-0 hover:text-terracotta transition">
          {info.phone}
        </a>
      </li>
      <li className={`flex items-center ${s.gap}`}>
        <Mail className={`${s.icon} text-terracotta shrink-0`} />
        <a href={`mailto:${info.email}`} className="min-w-0 break-all hover:text-terracotta transition">
          {info.email}
        </a>
      </li>
    </ul>
  );
}
