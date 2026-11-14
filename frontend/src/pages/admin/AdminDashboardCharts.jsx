import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { formatCurrency } from '../../utils/helpers';

const COLORS = ['#C67B5C', '#8B7355', '#F4A574', '#6B5344'];
const AXIS_TICK = { fontSize: 11 };

export default function AdminDashboardCharts({ graficos, recientesAdopciones }) {
  return (
    <>
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-5 sm:mb-8">
        <div className="card p-4 sm:p-6">
          <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Adopciones por mes</h3>
          <div className="h-[190px] sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficos.adopcionesPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D8" />
                <XAxis dataKey="mes" tick={AXIS_TICK} />
                <YAxis tick={AXIS_TICK} width={32} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#C67B5C" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4 sm:p-6">
          <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Donaciones por mes</h3>
          <div className="h-[190px] sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graficos.donacionesPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D8" />
                <XAxis dataKey="mes" tick={AXIS_TICK} />
                <YAxis tick={AXIS_TICK} width={48} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Line type="monotone" dataKey="total" stroke="#C67B5C" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-6">
          <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Mascotas por tipo</h3>
          <div className="h-[180px] sm:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={graficos.mascotasPorTipo} dataKey="cantidad" nameKey="tipo" cx="50%" cy="50%" outerRadius="75%" label>
                  {graficos.mascotasPorTipo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4 sm:p-6">
          <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Solicitudes recientes</h3>
          <div className="space-y-2 sm:space-y-3">
            {recientesAdopciones.map((s) => (
              <div key={s.id} className="flex justify-between gap-2 text-xs sm:text-sm py-2 border-b border-cream-200 last:border-0">
                <span className="min-w-0 truncate">{s.usuario_nombre} → {s.mascota_nombre}</span>
                <span className="capitalize text-terracotta shrink-0">{s.estado}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
