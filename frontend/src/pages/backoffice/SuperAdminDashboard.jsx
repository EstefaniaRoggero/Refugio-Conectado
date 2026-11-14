import { Building2, Clock3, FileText, HeartHandshake, PawPrint, Wallet, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../services/api';
import useAsyncData from '../../hooks/useAsyncData';
import Loader from '../../components/ui/Loader';
import { formatCurrency } from '../../utils/helpers';

export default function SuperAdminDashboard() {
  const { data, loading, error } = useAsyncData(() => api.get('/super-admin/overview').then((r) => r.data.data), []);
  if (loading) return <Loader />;
  if (error) return <div className="card p-6 text-red-600">No se pudieron cargar las métricas.</div>;
  const cards = [
    { label: 'Refugios activos', value: data.totales.refugios, icon: Building2 },
    { label: 'Refugios inactivos', value: data.totales.refugios_inactivos, icon: Building2 },
    { label: 'Usuarios activos', value: data.totales.usuarios, icon: Users },
    { label: 'Mascotas publicadas', value: data.totales.mascotas_publicadas, icon: PawPrint },
    { label: 'Adopciones realizadas', value: data.totales.adopciones, icon: HeartHandshake },
    { label: 'Solicitudes pendientes', value: data.totales.solicitudes_pendientes, icon: FileText },
    { label: 'Donaciones registradas', value: data.totales.donaciones_registradas, icon: Wallet },
  ];
  return (
    <div>
      <h1 className="section-title mb-2">Resumen general</h1>
      <p className="text-brown-soft mb-6">Comparación consolidada de todos los refugios.</p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => <div key={c.label} className="card p-4"><c.icon className="w-5 h-5 text-terracotta mb-3" /><p className="text-xl font-bold break-words">{c.value}</p><p className="text-xs text-brown-soft">{c.label}</p></div>)}
      </div>
      <div className="grid xl:grid-cols-5 gap-5 mt-6">
        <section className="card p-4 sm:p-5 xl:col-span-3"><h2 className="font-semibold mb-4">Actividad por refugio</h2><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.refugios}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="ciudad"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="mascotas" fill="#cc7657" radius={[5,5,0,0]}/><Bar dataKey="adopciones" fill="#6f5145" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></section>
        <section className="card p-4 sm:p-5 xl:col-span-2"><div className="flex items-center gap-2 mb-4"><Clock3 className="w-5 h-5 text-terracotta"/><h2 className="font-semibold">Actividad reciente</h2></div><div className="space-y-3">{data.recentActivity.map((item)=><div key={item.id} className="border-b border-cream-200 pb-3 last:border-0"><p className="text-sm font-medium">{item.accion}</p><p className="text-xs text-brown-soft">{item.actor||'Sistema'} · {item.entidad||'sistema'}</p><p className="text-[11px] text-brown-soft mt-1">{new Date(item.created_at).toLocaleString('es-AR')}</p></div>)}</div></section>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[850px] text-sm">
          <thead className="bg-cream-100"><tr>{['Refugio','Mascotas','Disponibles','Solicitudes','Adopciones','Donaciones','Voluntarios','Admins'].map((h) => <th key={h} className="p-3 text-left">{h}</th>)}</tr></thead>
          <tbody>{data.refugios.map((r) => <tr key={r.id_refugio} className="border-t border-cream-200"><td className="p-3"><strong>{r.nombre}</strong><br/><span className="text-xs text-brown-soft">{r.ciudad} · {r.activo ? 'Activo' : 'Inactivo'}</span></td><td className="p-3">{r.mascotas}</td><td className="p-3">{r.disponibles}</td><td className="p-3">{r.solicitudes}</td><td className="p-3">{r.adopciones}</td><td className="p-3">{formatCurrency(r.donaciones)}</td><td className="p-3">{r.voluntarios}</td><td className="p-3">{r.administradores}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

