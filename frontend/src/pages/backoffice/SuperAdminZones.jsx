import { useState } from 'react';
import { MapPinned, Pencil, Plus } from 'lucide-react';
import api from '../../services/api';
import useAsyncData from '../../hooks/useAsyncData';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import BackofficeModal from '../../components/backoffice/BackofficeModal';
import StatusBadge from '../../components/backoffice/StatusBadge';
import { showError, showSuccess } from '../../utils/alerts';

const empty = { nombre: '', slug: '', provincia: 'Córdoba', descripcion: '', activo: true };

export default function SuperAdminZones() {
  const { data: zones = [], loading, error, reload } = useAsyncData(() => api.get('/super-admin/zonas').then((r) => r.data.data.zones), []);
  const [form, setForm] = useState(null); const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));
  const save = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      if (form.id_zona) await api.put(`/super-admin/zonas/${form.id_zona}`, form);
      else await api.post('/super-admin/zonas', form);
      showSuccess('Zona guardada'); setForm(null); reload();
    } catch (err) { showError('No se pudo guardar', err.response?.data?.message || 'Revisá los datos'); }
    finally { setSaving(false); }
  };
  if (loading) return <Loader />;
  if (error) return <div className="card p-6 text-red-600">No se pudieron cargar las zonas.</div>;
  return <div>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6"><div><h1 className="section-title">Gestión de Zonas</h1><p className="text-sm text-brown-soft mt-1">Agrupá refugios por área operativa sin limitar cuántos puede haber por ciudad.</p></div><Button onClick={() => setForm({ ...empty })}><Plus className="w-4 h-4" /> Crear zona</Button></div>
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{zones.map((zone) => <article key={zone.id_zona} className="card p-5">
      <div className="flex items-start justify-between gap-3"><span className="w-10 h-10 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center"><MapPinned className="w-5 h-5" /></span><StatusBadge value={zone.activo ? 'activo' : 'inactivo'}>{zone.activo ? 'Activa' : 'Inactiva'}</StatusBadge></div>
      <h2 className="font-bold mt-4">{zone.nombre}</h2><p className="text-sm text-brown-soft">{zone.provincia || 'Sin provincia'}</p><p className="text-xs text-brown-soft mt-2">{zone.refugios} refugio(s) · {zone.localidades_count} localidad(es) · /{zone.slug}</p><p className="text-xs text-brown-soft mt-2 line-clamp-2">{zone.localidades || 'Sin localidades asociadas'}</p>
      <button onClick={() => setForm({ ...zone, activo: Boolean(zone.activo) })} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-terracotta"><Pencil className="w-4 h-4" /> Editar</button>
    </article>)}</div>
    {!zones.length && <div className="card p-8 text-center text-brown-soft">Todavía no hay zonas.</div>}
    {form && <BackofficeModal title={form.id_zona ? 'Editar zona' : 'Crear zona'} onClose={() => setForm(null)}><form onSubmit={save}>
      <div className="grid sm:grid-cols-2 gap-4"><Input label="Nombre *" value={form.nombre} onChange={set('nombre')} required /><Input label="Slug" value={form.slug || ''} onChange={set('slug')} placeholder="se genera desde el nombre" /><Input label="Provincia" value={form.provincia || ''} onChange={set('provincia')} /><Input label="Descripción" value={form.descripcion || ''} onChange={set('descripcion')} /></div>
      <label className="flex items-center gap-2 mt-4 text-sm"><input type="checkbox" checked={form.activo} onChange={(e) => setForm((current) => ({ ...current, activo: e.target.checked }))} /> Zona activa</label>
      <div className="flex flex-col-reverse sm:flex-row gap-2 mt-6"><Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancelar</Button><Button type="submit" loading={saving}>Guardar</Button></div>
    </form></BackofficeModal>}
  </div>;
}
