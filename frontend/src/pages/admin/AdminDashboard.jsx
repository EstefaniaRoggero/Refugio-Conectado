import { PawPrint, Users, Heart, DollarSign, FileText, Mail } from 'lucide-react';
import { Suspense, lazy } from 'react';
import api from '../../services/api';
import Loader from '../../components/ui/Loader';
import AdminUrgencyPanel from '../../components/admin/AdminUrgencyPanel';
import useAsyncData from '../../hooks/useAsyncData';
import { formatCurrency } from '../../utils/helpers';

const AdminDashboardCharts = lazy(() => import('./AdminDashboardCharts'));

export default function AdminDashboard() {
  const { data, loading } = useAsyncData(
    () => api.get('/admin/dashboard').then((res) => res.data.data),
    []
  );

  if (loading) return <Loader />;
  const { metricas, graficos, recientesAdopciones, urgencia } = data;

  const metricCards = [
    { icon: PawPrint, label: 'Mascotas', value: metricas.totalMascotas, sub: `${metricas.mascotasDisponibles} disponibles` },
    { icon: Heart, label: 'Adopciones', value: metricas.adopcionesCompletadas },
    { icon: DollarSign, label: 'Donaciones', value: formatCurrency(metricas.totalDonaciones) },
    { icon: Users, label: 'Usuarios', value: metricas.totalUsuarios },
    { icon: FileText, label: 'Pendientes', value: metricas.solicitudesPendientes },
    { icon: Mail, label: 'Mensajes', value: metricas.mensajesSinLeer, sub: 'sin leer' },
  ];

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-8">
        {metricCards.map((m) => (
          <div key={m.label} className="card p-3 sm:p-5">
            <m.icon className="w-5 h-5 sm:w-6 sm:h-6 text-terracotta mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl font-bold break-words">{m.value}</p>
            <p className="text-brown-soft text-xs sm:text-sm">{m.label}</p>
            {m.sub && <p className="text-[11px] sm:text-xs text-brown-soft/70">{m.sub}</p>}
          </div>
        ))}
      </div>

      <AdminUrgencyPanel urgencia={urgencia} />

      <Suspense fallback={<Loader text="Cargando gráficos..." />}>
        <AdminDashboardCharts graficos={graficos} recientesAdopciones={recientesAdopciones} />
      </Suspense>
    </div>
  );
}
