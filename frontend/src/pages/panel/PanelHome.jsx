import { Link } from 'react-router-dom';
import { FileText, Heart, DollarSign } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../context/authStore';
import Loader from '../../components/ui/Loader';
import useAsyncData from '../../hooks/useAsyncData';

import useTenantPath from '../../hooks/useTenantPath';

export default function PanelHome() {
  const { user } = useAuthStore();
  const tenantPath = useTenantPath();
  const { data: stats = { solicitudes: 0, favoritos: 0, donaciones: 0 }, loading } = useAsyncData(
    () => Promise.all([
      api.get('/adopciones/mis-solicitudes'),
      api.get('/favoritos'),
      api.get('/donaciones/mis-donaciones'),
    ]).then(([sol, fav, don]) => ({
      solicitudes: sol.data.data.solicitudes.length,
      favoritos: fav.data.data.favoritos.length,
      donaciones: don.data.data.donaciones.length,
    })),
    []
  );

  if (loading) return <Loader />;

  const cards = [
    { to: tenantPath('panel/solicitudes'), icon: FileText, label: 'Solicitudes', value: stats.solicitudes },
    { to: tenantPath('panel/favoritos'), icon: Heart, label: 'Favoritos', value: stats.favoritos },
    { to: tenantPath('donar?vista=historial'), icon: DollarSign, label: 'Donaciones', value: stats.donaciones },
  ];

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Hola, {user?.nombre} 👋</h1>
      <p className="text-sm sm:text-base text-brown-soft mb-5 sm:mb-8">Bienvenido a tu panel personal</p>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="card p-3 sm:p-6 hover:shadow-card transition group">
            <c.icon className="w-5 h-5 sm:w-8 sm:h-8 text-terracotta mb-1 sm:mb-3 group-hover:scale-110 transition" />
            <p className="text-xl sm:text-3xl font-bold">{c.value}</p>
            <p className="text-xs sm:text-base text-brown-soft">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
