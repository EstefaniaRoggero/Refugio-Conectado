import { useState } from 'react';
import { Building2, CheckCircle2, PauseCircle, Pencil, Plus, X } from 'lucide-react';
import api from '../../services/api';
import useAsyncData from '../../hooks/useAsyncData';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LocationPickerMap from '../../components/map/LocationPickerMap';
import { showError, showSuccess } from '../../utils/alerts';

const empty = { nombre: '', slug: '', ciudad: '', id_zona: '', direccion: '', descripcion: '', telefono: '', email: '', latitud: '', longitud: '', activo: true };

export default function SuperAdminRefugios() {
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [refugios, zones] = await Promise.all([api.get('/super-admin/refugios'), api.get('/super-admin/zonas')]);
    return { refugios: refugios.data.data.refugios, zones: zones.data.data.zones };
  }, []);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (form.id_refugio) await api.put(`/super-admin/refugios/${form.id_refugio}`, form);
      else await api.post('/super-admin/refugios', form);
      await showSuccess(form.id_refugio ? 'Refugio actualizado' : 'Refugio creado');
      setForm(null); reload();
    } catch (err) { showError('No se pudo guardar', err.response?.data?.message || 'Revisá los datos'); }
    finally { setSaving(false); }
  };
  if (loading) return <Loader />;
  if (error || !data) return <div className="card p-6 text-red-600">No se pudieron cargar los refugios.</div>;
  const { refugios, zones } = data;
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div><h1 className="section-title">Refugios</h1><p className="text-sm text-brown-soft mt-1">Altas, datos públicos y estado operativo.</p></div>
        <Button onClick={() => setForm(empty)}><Plus className="w-4 h-4" /> Nuevo refugio</Button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {refugios.map((r) => (
          <article key={r.id_refugio} className="card p-5">
            <div className="flex items-start justify-between gap-3"><span className="w-10 h-10 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center"><Building2 className="w-5 h-5" /></span><span className={`text-xs px-2 py-1 rounded-full ${r.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{r.activo ? 'Activo' : 'Inactivo'}</span></div>
            <h2 className="font-bold mt-4">{r.nombre}</h2><p className="text-sm text-brown-soft">{r.ciudad}{r.zona ? ` · ${r.zona}` : ''}</p><p className="text-xs text-brown-soft mt-2">Responsable: {r.responsables || 'Sin asignar'}</p><p className="text-xs text-brown-soft mt-1">{r.email || 'Sin email'}{r.telefono ? ` · ${r.telefono}` : ''}</p><div className="grid grid-cols-2 gap-2 mt-3 text-center"><div className="rounded-xl bg-cream-100 p-2"><strong>{r.mascotas_publicadas}</strong><p className="text-[10px] text-brown-soft">Mascotas</p></div><div className="rounded-xl bg-cream-100 p-2"><strong>{r.adopciones}</strong><p className="text-[10px] text-brown-soft">Adopciones</p></div></div><p className="text-xs text-brown-soft mt-2">/{r.slug}</p>
            <button onClick={() => setForm({ ...r, id_zona: r.id_zona || '', activo: Boolean(r.activo) })} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-terracotta"><Pencil className="w-4 h-4" /> Editar</button>
          </article>
        ))}
      </div>
      {form && <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-2 sm:p-4"><form onSubmit={save} className="card w-full max-w-2xl max-h-[calc(100dvh-1rem)] overflow-y-auto p-4 sm:p-6">
        <div className="flex justify-between gap-3 mb-5"><div><h2 className="text-lg font-bold">{form.id_refugio ? 'Editar refugio' : 'Nuevo refugio'}</h2><p className="text-xs text-brown-soft">Cada refugio tiene su propia dirección pública, aunque comparta ciudad con otros.</p></div><button type="button" onClick={() => setForm(null)} aria-label="Cerrar formulario"><X /></button></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Nombre *" value={form.nombre} onChange={set('nombre')} required />
          <div><Input label="Slug *" value={form.slug || ''} onChange={set('slug')} placeholder="ej.: pilar-huellitas" /><p className="text-xs text-brown-soft mt-1">Debe ser único para este refugio, no para la ciudad.</p></div>
          <Input label="Ciudad *" value={form.ciudad} onChange={set('ciudad')} required />
          <label className="text-sm font-medium">Zona<select className="input-field mt-1.5" value={form.id_zona || ''} onChange={set('id_zona')}><option value="">Sin zona asignada</option>{zones.map((zone) => <option key={zone.id_zona} value={zone.id_zona}>{zone.nombre}{zone.activo ? '' : ' (inactiva)'}</option>)}</select></label>
          <Input label="Dirección" value={form.direccion || ''} onChange={set('direccion')} />
          <Input label="Teléfono" value={form.telefono || ''} onChange={set('telefono')} />
          <Input label="Email" type="email" value={form.email || ''} onChange={set('email')} />
          <Input label="Latitud" type="number" step="any" value={form.latitud ?? ''} onChange={set('latitud')} />
          <Input label="Longitud" type="number" step="any" value={form.longitud ?? ''} onChange={set('longitud')} />
        </div>
        <LocationPickerMap
          latitud={form.latitud}
          longitud={form.longitud}
          searchHint={[form.direccion, form.ciudad, 'Córdoba, Argentina'].filter(Boolean).join(', ')}
          onChange={(latitud, longitud) => setForm((current) => ({ ...current, latitud, longitud }))}
        />
        <label className="block text-sm font-medium mt-4 mb-1.5">Descripción</label><textarea className="input-field min-h-24" value={form.descripcion || ''} onChange={set('descripcion')} />
        <section className={`mt-4 rounded-2xl border p-4 ${form.activo ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              {form.activo ? <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" /> : <PauseCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />}
              <div><p className="font-semibold text-sm">{form.activo ? 'Refugio activo y visible' : 'Refugio desactivado'}</p><p className="text-xs text-brown-soft mt-1">{form.activo ? 'Su sitio público está disponible.' : 'No aparece públicamente, pero sus datos quedan guardados.'}</p></div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.activo}
              aria-label="Estado del refugio"
              onClick={() => setForm((current) => ({ ...current, activo: !current.activo }))}
              className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${form.activo ? 'bg-green-600' : 'bg-gray-400'}`}
            >
              <span className={`absolute left-1 top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <p className="text-xs text-brown-soft mt-3">Podés desactivarlo si deja de pagar y volver a activarlo más adelante sin perder información.</p>
        </section>
        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-6"><Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancelar</Button><Button type="submit" loading={saving}>Guardar</Button></div>
      </form></div>}
    </div>
  );
}

