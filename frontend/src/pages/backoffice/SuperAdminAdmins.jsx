import { useState } from 'react';
import { Copy, KeyRound, Pencil, Plus, Shield, X } from 'lucide-react';
import api from '../../services/api';
import useAsyncData from '../../hooks/useAsyncData';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { showError, showSuccess } from '../../utils/alerts';

const empty = { nombre: '', apellido: '', email: '', rol: 'admin', refugio_ids: [], activo: true };

export default function SuperAdminAdmins() {
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [a, r] = await Promise.all([api.get('/super-admin/admins'), api.get('/super-admin/refugios')]);
    return { admins: a.data.data.admins, refugios: r.data.data.refugios };
  }, []);
  const [form, setForm] = useState(null); const [saving, setSaving] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleRefugio = (id) => setForm((f) => ({ ...f, refugio_ids: f.refugio_ids.includes(id) ? f.refugio_ids.filter((x) => x !== id) : [...f.refugio_ids, id] }));
  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      let response;
      if (form.id) response = await api.put(`/super-admin/admins/${form.id}`, form);
      else response = await api.post('/super-admin/admins', form);
      if (response.data.data?.invitationToken) {
        setInviteLink(`${window.location.origin}/backoffice/activar/${response.data.data.invitationToken}`);
      }
      await showSuccess(form.id ? 'Administrador actualizado' : 'Administrador creado'); setForm(null); reload();
    } catch (err) { showError('No se pudo guardar', err.response?.data?.message || 'Revisá los datos'); }
    finally { setSaving(false); }
  };
  const renewInvitation = async (id) => {
    try {
      const response = await api.post(`/super-admin/admins/${id}/invitacion`);
      setInviteLink(`${window.location.origin}/backoffice/activar/${response.data.data.invitationToken}`);
      showSuccess('Invitación generada', 'El enlace vence en 48 horas.');
    } catch (err) { showError('No se pudo generar', err.response?.data?.message); }
  };
  if (loading) return <Loader />;
  if (error || !data) return <div className="card p-6 text-red-600">No se pudieron cargar los administradores.</div>;
  return <div>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6"><div><h1 className="section-title">Administradores</h1><p className="text-sm text-brown-soft mt-1">Accesos globales y responsables por refugio.</p></div><Button onClick={() => setForm({ ...empty })}><Plus className="w-4 h-4" /> Nuevo administrador</Button></div>
    {inviteLink && <div className="card p-4 mb-5 border-l-4 border-l-terracotta"><p className="font-semibold text-sm">Enlace de activación</p><p className="text-xs text-brown-soft mt-1">Compartilo de forma privada. Vence en 48 horas y solo puede usarse una vez.</p><div className="flex flex-col sm:flex-row gap-2 mt-3"><input className="input-field text-xs" readOnly value={inviteLink} /><Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(inviteLink)}><Copy className="w-4 h-4" /> Copiar</Button></div></div>}
    <div className="space-y-3">{data.admins.map((a) => <article key={a.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4"><span className="w-10 h-10 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0"><Shield className="w-5 h-5" /></span><div className="flex-1 min-w-0"><p className="font-semibold">{a.nombre} {a.apellido}</p><p className="text-sm text-brown-soft break-all">{a.email}</p><p className="text-xs text-brown-soft mt-1">{a.rol === 'super_admin' ? 'Acceso global' : a.refugios || 'Sin refugios'}</p></div><div className="flex items-center gap-2"><span className={`text-xs px-2 py-1 rounded-full ${a.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{a.activo ? 'Activo' : 'Inactivo'}</span><button title="Generar invitación" onClick={() => renewInvitation(a.id)} className="p-2 text-brown-soft hover:text-terracotta"><KeyRound className="w-4 h-4" /></button><button title="Editar" onClick={() => setForm({ ...a, activo: Boolean(a.activo) })} className="p-2 text-terracotta"><Pencil className="w-4 h-4" /></button></div></article>)}</div>
    {form && <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-2 sm:p-4"><form onSubmit={save} className="card w-full max-w-xl max-h-[calc(100dvh-1rem)] overflow-y-auto p-4 sm:p-6"><div className="flex justify-between mb-5"><h2 className="text-lg font-bold">{form.id ? 'Editar administrador' : 'Nuevo administrador'}</h2><button type="button" onClick={() => setForm(null)}><X /></button></div>
      <div className="grid sm:grid-cols-2 gap-4"><Input label="Nombre *" value={form.nombre} onChange={set('nombre')} required /><Input label="Apellido *" value={form.apellido} onChange={set('apellido')} required /></div><div className="mt-4"><Input label="Email *" type="email" value={form.email} onChange={set('email')} required /></div>{!form.id && <p className="text-xs text-brown-soft mt-3">Al guardar se generará un enlace privado para que la persona configure su contraseña.</p>}
      <label className="block text-sm font-medium mt-4 mb-1.5">Tipo de acceso</label><select className="input-field" value={form.rol} onChange={set('rol')}><option value="admin">Administrador de refugio</option><option value="super_admin">Superadministrador global</option></select>
      {form.rol === 'admin' && <fieldset className="mt-4"><legend className="text-sm font-medium mb-2">Refugios asignados *</legend><div className="grid sm:grid-cols-2 gap-2">{data.refugios.filter((r) => r.activo).map((r) => <label key={r.id_refugio} className="flex items-start gap-2 p-3 rounded-xl border border-cream-200 text-sm"><input type="checkbox" className="mt-0.5" checked={form.refugio_ids.includes(r.id_refugio)} onChange={() => toggleRefugio(r.id_refugio)} /><span>{r.nombre}</span></label>)}</div></fieldset>}
      {form.id && <label className="flex items-center gap-2 mt-4 text-sm"><input type="checkbox" checked={form.activo} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))} /> Acceso activo</label>}
      <div className="flex flex-col-reverse sm:flex-row gap-2 mt-6"><Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancelar</Button><Button type="submit" loading={saving}>Guardar</Button></div>
    </form></div>}
  </div>;
}

