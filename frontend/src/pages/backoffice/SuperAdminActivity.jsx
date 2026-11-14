import { useState } from 'react';
import api from '../../services/api';
import useAsyncData from '../../hooks/useAsyncData';
import Loader from '../../components/ui/Loader';
import Pagination from '../../components/backoffice/Pagination';

const safeJson = (value) => {
  if (!value) return '—';
  if (typeof value !== 'string') return JSON.stringify(value);
  try { return JSON.stringify(JSON.parse(value)); } catch { return value; }
};

export default function SuperAdminActivity() {
  const [filters, setFilters] = useState({ refugio_id: '', usuario_id: '', modulo: '', accion: '', desde: '', hasta: '' });
  const [page, setPage] = useState(1);
  const setFilter = (key) => (event) => {
    setFilters((current) => ({ ...current, [key]: event.target.value }));
    setPage(1);
  };
  const { data, loading, error } = useAsyncData(async () => {
    const params = { page, ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) };
    const [logs, refuges, users] = await Promise.all([
      api.get('/super-admin/actividad', { params }),
      api.get('/super-admin/refugios'),
      api.get('/super-admin/usuarios', { params: { limit: 100 } }),
    ]);
    return { ...logs.data.data, refugios: refuges.data.data.refugios, usuarios: users.data.data.usuarios };
  }, [page, filters]);

  return <div>
    <h1 className="section-title mb-2">Auditoría</h1>
    <p className="text-sm text-brown-soft mb-6">Historial de acciones importantes con usuario, fecha, módulo y registro afectado.</p>
    <div className="card p-4 mb-5 grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <label className="text-sm font-medium">Usuario<select className="input-field mt-1.5" value={filters.usuario_id} onChange={setFilter('usuario_id')}><option value="">Todos</option>{data?.usuarios?.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}</select></label>
      <label className="text-sm font-medium">Refugio<select className="input-field mt-1.5" value={filters.refugio_id} onChange={setFilter('refugio_id')}><option value="">Todos</option>{data?.refugios?.map((r) => <option key={r.id_refugio} value={r.id_refugio}>{r.nombre}</option>)}</select></label>
      <label className="text-sm font-medium">Módulo<input className="input-field mt-1.5" value={filters.modulo} onChange={setFilter('modulo')} placeholder="Ej.: usuarios" /></label>
      <label className="text-sm font-medium">Acción<input className="input-field mt-1.5" value={filters.accion} onChange={setFilter('accion')} placeholder="Ej.: actualizar" /></label>
      <label className="text-sm font-medium">Desde<input className="input-field mt-1.5" type="date" value={filters.desde} onChange={setFilter('desde')} /></label>
      <label className="text-sm font-medium">Hasta<input className="input-field mt-1.5" type="date" value={filters.hasta} onChange={setFilter('hasta')} /></label>
    </div>
    {loading ? <Loader /> : error || !data ? <div className="card p-6 text-red-600">No se pudo cargar el registro de actividad.</div> : <>
      <div className="card overflow-x-auto"><table className="w-full min-w-[1100px] text-sm"><thead className="bg-cream-100"><tr>{['Fecha','Usuario','Rol','Refugio','Módulo','Acción','Registro afectado','Resultado','Detalle'].map((h) => <th key={h} className="p-3 text-left">{h}</th>)}</tr></thead><tbody>
        {data.registros.map((r) => <tr key={r.id} className="border-t border-cream-200 align-top"><td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString('es-AR')}</td><td className="p-3">{r.actor || 'Sistema'}</td><td className="p-3">{r.rol_actor || '—'}</td><td className="p-3">{r.refugio_nombre || 'Global'}</td><td className="p-3">{r.entidad || 'sistema'}</td><td className="p-3 font-medium">{r.accion}</td><td className="p-3">{r.entidad_id || '—'}</td><td className="p-3"><span className={r.resultado === 'exito' ? 'text-green-700' : 'text-red-600'}>{r.resultado}</span></td><td className="p-3 max-w-xs"><code className="text-[10px] whitespace-pre-wrap break-all">{safeJson(r.datos)}</code></td></tr>)}
        {!data.registros.length && <tr><td colSpan="9" className="p-8 text-center text-brown-soft">No hay actividad para los filtros seleccionados.</td></tr>}
      </tbody></table></div>
      <Pagination {...data.pagination} onChange={setPage} />
    </>}
  </div>;
}
