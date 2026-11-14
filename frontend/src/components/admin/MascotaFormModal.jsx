import { useEffect, useState } from 'react';
import api from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { showSuccess, showError } from '../../utils/alerts';
import { getImageUrl } from '../../utils/helpers';
import { validatePetImage } from '../../utils/imageValidation';
import { buildMascotaPayload } from '../../utils/mascotaForm';
import {
  EMPTY_MASCOTA_FORM,
  mapMascotaToForm,
  MASCOTA_TIPO_OPTIONS,
  MASCOTA_ESTADO_OPTIONS,
  MASCOTA_TAMANO_OPTIONS,
  MASCOTA_ENERGIA_OPTIONS,
  MASCOTA_SEXO_OPTIONS,
  MASCOTA_EDAD_UNIDAD_OPTIONS,
} from '../../constants/mascota';

export default function MascotaFormModal({ isOpen, mascota, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_MASCOTA_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [catalogOptions, setCatalogOptions] = useState({
    tipos: MASCOTA_TIPO_OPTIONS,
    tamanos: MASCOTA_TAMANO_OPTIONS,
    energia: MASCOTA_ENERGIA_OPTIONS,
  });

  const clearImagePreview = () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview('');
    setImageFile(null);
  };

  useEffect(() => {
    if (!isOpen) return;
    clearImagePreview();
    if (mascota) {
      setForm(mapMascotaToForm(mascota));
      if (mascota.imagen) setImagePreview(getImageUrl(mascota.imagen));
    } else {
      setForm(EMPTY_MASCOTA_FORM);
    }
    setImageFile(null);
  }, [isOpen, mascota]);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      api.get('/super-admin/catalogos-publicos', { params: { grupos: 'tamanos,niveles_energia' } }),
      api.get('/catalogos/tipos-mascota'),
    ]).then(([globalCatalogs, petTypes]) => {
      const items = globalCatalogs.data.data.catalogs;
      setCatalogOptions({
        tipos: petTypes.data.data.tipos.map((item) => ({ value: item.codigo, label: item.tipo })),
        tamanos: items.filter((item) => item.grupo === 'tamanos').map((item) => ({ value: item.codigo, label: item.nombre })),
        energia: items.filter((item) => item.grupo === 'niveles_energia').map((item) => ({ value: item.codigo, label: item.nombre })),
      });
    }).catch(() => {});
  }, [isOpen]);

  const handleClose = () => {
    clearImagePreview();
    onClose();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validatePetImage(file);
    if (!validation.valid) {
      showError('Formato no válido', validation.message);
      e.target.value = '';
      return;
    }

    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const save = async () => {
    try {
      const payload = buildMascotaPayload(form, imageFile);
      if (mascota?.id) await api.put(`/mascotas/${mascota.id}`, payload);
      else await api.post('/mascotas', payload);

      showSuccess(mascota?.id ? 'Actualizada' : 'Creada');
      handleClose();
      onSaved();
    } catch (err) {
      showError('Error', err.response?.data?.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
      <div className="card w-full max-w-lg max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-3">
        <h2 className="font-bold text-lg">{mascota?.id ? 'Editar' : 'Nueva'} mascota</h2>
        <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <div>
          <label className="block text-sm font-medium text-brown-dark mb-1.5">Imagen (JPG o PNG)</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.jfif,.png,image/jpeg,image/png"
            onChange={handleImageChange}
            className="input-field file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-terracotta file:text-white file:text-sm file:cursor-pointer"
          />
          <p className="mt-1 text-xs text-brown-soft">Máximo 5 MB</p>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Vista previa"
              className="mt-3 w-full h-32 sm:h-40 object-cover rounded-xl border border-cream-200"
            />
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Select label="Tipo" options={catalogOptions.tipos} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
          <Select label="Estado" options={MASCOTA_ESTADO_OPTIONS} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-brown-dark mb-1.5">Edad aproximada</label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={30}
                className="input-field flex-1 min-w-0"
                value={form.edad}
                onChange={(e) => setForm({ ...form, edad: parseInt(e.target.value, 10) || 0 })}
              />
              <select
                className="input-field !w-28 shrink-0"
                value={form.edad_unidad}
                onChange={(e) => setForm({ ...form, edad_unidad: e.target.value })}
              >
                {MASCOTA_EDAD_UNIDAD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <Select label="Género" options={MASCOTA_SEXO_OPTIONS} value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Select label="Tamaño" options={catalogOptions.tamanos} value={form.tamano} onChange={(e) => setForm({ ...form, tamano: e.target.value })} />
          <Select label="Nivel de energía" options={catalogOptions.energia} value={form.energia} onChange={(e) => setForm({ ...form, energia: e.target.value })} />
        </div>
        <textarea className="input-field min-h-[80px]" placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        <div className="grid grid-cols-2 sm:flex gap-2 pt-1">
          <Button onClick={save}>Guardar</Button>
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}
