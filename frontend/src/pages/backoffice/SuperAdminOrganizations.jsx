import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Building2, Pencil, Plus } from 'lucide-react';
import api from '../../services/api';
import useAsyncData from '../../hooks/useAsyncData';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import BackofficeModal from '../../components/backoffice/BackofficeModal';
import StatusBadge from '../../components/backoffice/StatusBadge';
import { showError, showSuccess } from '../../utils/alerts';

const blank = (tipo) => ({ tipo, nombre: '', cuit: '', email: '', telefono: '', direccion: '', ciudad: '', id_zona: '', contacto: '', notas: '', activo: true });

export default function SuperAdminOrganizations() {
  const { pathname } = useLocation();
  const tipo = pathname.includes('veterinarias') ? 'veterinaria' : 'municipalidad';
  const label = tipo === 'veterinaria' ? 'Veterinarias' : 'Municipalidades';
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [organizations, zones] = await Promise.all([api.get('/super-admin/organizaciones', { params: { tipo } }), api.get('/super-admin/zonas')]);
    return { organizations: organizations.data.data.organizations, zones: zones.data.data.zones };
  }, [tipo]);
  const [form, setForm] = useState(null); const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));
  const save = async (event) => { event.preventDefault(); setSaving(true); try { if (form.id) await api.put(`/super-admin/organizaciones/${form.id}`, form); else await api.post('/super-admin/organizaciones', form); showSuccess(`${tipo === 'veterinaria' ? 'Veterinaria' : 'Municipalidad'} guardada`); setForm(null); reload(); } catch (err) { showError('No se pudo guardar', err.response?.data?.message); } finally { setSaving(false); } };
  if (loading) return <Loader />;
  if (error || !data) return <div className="card p-6 text-red-600">No se pudo cargar la información.</div>;
  return <div><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6"><div><h1 className="section-title">{label}</h1><p className="text-sm text-brown-soft mt-1">Contactos institucionales y organizaciones asociadas.</p></div><Button onClick={() => setForm(blank(tipo))}><Plus className="w-4 h-4" /> Nueva</Button></div>
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{data.organizations.map((item) => <article key={item.id} className="card p-5"><div className="flex justify-between gap-2"><Building2 className="w-6 h-6 text-terracotta"/><StatusBadge value={item.activo ? 'activo' : 'inactivo'}>{item.activo ? 'Activa' : 'Inactiva'}</StatusBadge></div><h2 className="font-bold mt-4">{item.nombre}</h2><p className="text-sm text-brown-soft">{item.ciudad || 'Sin ciudad'}{item.zona ? ` · ${item.zona}` : ''}</p><p className="text-xs text-brown-soft mt-2">{item.contacto || item.email || 'Sin contacto'}</p><p className="text-xs font-medium mt-2">{item.convenios} convenio(s) asociado(s)</p><button onClick={() => setForm({ ...item, id_zona: item.id_zona || '', activo: Boolean(item.activo) })} className="mt-4 inline-flex items-center gap-2 text-sm text-terracotta font-medium"><Pencil className="w-4 h-4"/> Editar</button></article>)}</div>
    {!data.organizations.length && <div className="card p-8 text-center text-brown-soft">No hay registros todavía.</div>}
    {form && <BackofficeModal title={`${form.id ? 'Editar' : 'Nueva'} ${tipo}`} onClose={() => setForm(null)}><form onSubmit={save}><div className="grid sm:grid-cols-2 gap-4"><Input label="Nombre *" value={form.nombre} onChange={set('nombre')} required/><Input label="CUIT" value={form.cuit || ''} onChange={set('cuit')}/><Input label="Email" type="email" value={form.email || ''} onChange={set('email')}/><Input label="Teléfono" value={form.telefono || ''} onChange={set('telefono')}/><Input label="Ciudad" value={form.ciudad || ''} onChange={set('ciudad')}/><Input label="Dirección" value={form.direccion || ''} onChange={set('direccion')}/><Input label="Persona de contacto" value={form.contacto || ''} onChange={set('contacto')}/><label className="text-sm font-medium">Zona<select className="input-field mt-1.5" value={form.id_zona || ''} onChange={set('id_zona')}><option value="">Sin zona</option>{data.zones.map((z) => <option key={z.id_zona} value={z.id_zona}>{z.nombre}</option>)}</select></label></div><label className="block text-sm font-medium mt-4">Notas<textarea className="input-field min-h-20 mt-1.5" value={form.notas || ''} onChange={set('notas')}/></label><label className="flex items-center gap-2 mt-4 text-sm"><input type="checkbox" checked={form.activo} onChange={(e) => setForm((current) => ({ ...current, activo: e.target.checked }))}/> Organización activa</label><div className="flex flex-col-reverse sm:flex-row gap-2 mt-6"><Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancelar</Button><Button type="submit" loading={saving}>Guardar</Button></div></form></BackofficeModal>}
  </div>;
}
