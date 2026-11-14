import api from '../../services/api';
import Loader from '../../components/ui/Loader';
import useAsyncData from '../../hooks/useAsyncData';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function AdminDonaciones() {
  const { data = { donaciones: [], estadisticas: {} }, loading } = useAsyncData(
    () => api.get('/donaciones').then((res) => res.data.data),
    []
  );

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-2">Donaciones</h1>
      <p className="text-2xl sm:text-3xl font-bold text-terracotta mb-4 sm:mb-6">{formatCurrency(data.estadisticas.totalRecaudado)} recaudados</p>
      <div className="md:hidden space-y-2">
        {data.donaciones.map((d) => (
          <div key={d.id} className="card p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{d.nombre_donante || `${d.nombre || ''} ${d.apellido || ''}`}</p>
              <p className="text-xs text-brown-soft capitalize">{d.metodo_pago} · {formatDate(d.created_at)}</p>
            </div>
            <span className="text-terracotta font-semibold shrink-0">{formatCurrency(d.monto)}</span>
          </div>
        ))}
      </div>
      <div className="card overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-cream-100">
            <tr>
              <th className="p-3 text-left">Donante</th>
              <th className="p-3 text-left">Monto</th>
              <th className="p-3 text-left">Método</th>
              <th className="p-3 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {data.donaciones.map((d) => (
              <tr key={d.id} className="border-t border-cream-200">
                <td className="p-3">{d.nombre_donante || `${d.nombre || ''} ${d.apellido || ''}`}</td>
                <td className="p-3 text-terracotta font-medium">{formatCurrency(d.monto)}</td>
                <td className="p-3 capitalize">{d.metodo_pago}</td>
                <td className="p-3">{formatDate(d.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
