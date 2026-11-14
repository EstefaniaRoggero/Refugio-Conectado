import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import useTenantStore from '../../context/tenantStore';
import { ZONE_SELECTOR_LABEL } from '../../constants/navigation';

export default function ChangeRefugioLink({ className = '', showIcon = true, onNavigate }) {
  const clearRefugio = useTenantStore((s) => s.clearRefugio);

  const handleClick = () => {
    clearRefugio();
    onNavigate?.();
  };

  return (
    <Link
      to="/"
      onClick={handleClick}
      className={className}
      title="Ver todos los refugios y elegir otra zona"
    >
      {showIcon && <MapPin className="w-4 h-4 shrink-0" />}
      {ZONE_SELECTOR_LABEL}
    </Link>
  );
}
