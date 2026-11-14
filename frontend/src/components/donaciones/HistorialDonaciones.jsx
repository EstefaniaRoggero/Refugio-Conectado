import api from '../../services/api';
import Loader from '../ui/Loader';
import useAsyncData from '../../hooks/useAsyncData';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function HistorialDonaciones() {
  const { data: donaciones = [], loading } = useAsyncData(
    () => api.get('/donaciones/mis-donaciones').then((res) => res.data.data.donaciones),
    []
  );

  if (loading) return <Loader />;

  if (donaciones.length === 0) {
    return <div className="card p-8 sm:p-12 text-center text-brown-soft">Todavía no realizaste donaciones</div>;
  }

  const total = donaciones.reduce((acc, d) => acc + Number(d.monto || 0), 0);

  return (
    <div className="space-y-4">
      <div className="card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-brown-soft text-sm sm:text-base">{donaciones.length} {donaciones.length === 1 ? 'donación' : 'donaciones'}</span>
        <span className="font-semibold text-terracotta text-lg sm:text-xl">Total aportado: {formatCurrency(total)}</span>
      </div>

      <div className="sm:hidden space-y-2">
        {donaciones.map((d) => (
          <div key={d.id} className="card p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-terracotta">{formatCurrency(d.monto)}</p>
              <p className="text-xs text-brown-soft capitalize">{d.metodo_pago} · {d.tipo}</p>
            </div>
            <span className="text-xs text-brown-soft shrink-0">{formatDate(d.created_at)}</span>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden hidden sm:block">
        <table className="w-full text-sm">
          <thead className="bg-cream-100">
            <tr>
              <th className="text-left p-4">Fecha</th>
              <th className="text-left p-4">Monto</th>
              <th className="text-left p-4">Método</th>
              <th className="text-left p-4">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {donaciones.map((d) => (
              <tr key={d.id} className="border-t border-cream-200">
                <td className="p-4">{formatDate(d.created_at)}</td>
                <td className="p-4 font-medium text-terracotta">{formatCurrency(d.monto)}</td>
                <td className="p-4 capitalize">{d.metodo_pago}</td>
                <td className="p-4 capitalize">{d.tipo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
