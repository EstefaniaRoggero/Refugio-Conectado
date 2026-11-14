import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import api from '../../services/api';
import useAsyncData from '../../hooks/useAsyncData';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { showError, showSuccess } from '../../utils/alerts';

export default function SuperAdminSettings() {
  const { data, loading, error, reload } = useAsyncData(() => api.get('/super-admin/configuracion').then((response) => response.data.data), []);
  const [settings, setSettings] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data) setSettings(data.settings); }, [data]);

  const setValue = (key, value) => {
    setSettings((items) => items.map((item) => item.clave === key ? { ...item, valor: value } : item));
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put('/super-admin/configuracion', { settings });
      await showSuccess('Configuración guardada');
      reload();
    } catch (err) {
      showError('No se pudo guardar', err.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;
  if (error || !data) return <div className="card p-6 text-red-600">No se pudo cargar la configuración.</div>;

  return <div>
    <h1 className="section-title mb-2">Configuración</h1>
    <p className="text-sm text-brown-soft mb-6">Parámetros generales de la plataforma.</p>
    <form onSubmit={saveSettings} className="card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <Settings className="w-5 h-5 text-terracotta" />
        <h2 className="font-semibold">Parámetros generales</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {settings.map((item) => <div key={item.clave}>
          {['true', 'false'].includes(item.valor) ? <label className="block text-sm font-medium">
            {item.descripcion}
            <select className="input-field mt-1.5" value={item.valor} onChange={(event) => setValue(item.clave, event.target.value)}>
              <option value="true">Habilitado</option>
              <option value="false">Deshabilitado</option>
            </select>
          </label> : <Input
            label={item.descripcion}
            value={item.valor || ''}
            type={item.clave.includes('email') ? 'email' : item.clave.includes('dias') ? 'number' : 'text'}
            onChange={(event) => setValue(item.clave, event.target.value)}
          />}
        </div>)}
      </div>
      <Button type="submit" loading={saving} className="mt-6">Guardar configuración</Button>
    </form>
  </div>;
}
