import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../context/authStore';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { showError, showSuccess } from '../../utils/alerts';
import { compressImage } from '../../utils/imageCompression';
import { AVISO_ESPECIE_OPTIONS, MAX_FOTOS_AVISO } from '../../constants/perdidos';

const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function AvisoPerdidoForm({ tipo, onCancel, onSent }) {
  const { user } = useAuthStore();
  const esPerdido = tipo === 'perdido';
  const [form, setForm] = useState({
    especie: 'perro',
    nombre_mascota: '',
    descripcion: '',
    zona: '',
    fecha_evento: hoy(),
    resguardado: 'true',
    contacto_nombre: user?.nombre ? `${user.nombre} ${user.apellido || ''}`.trim() : '',
    contacto_telefono: user?.telefono || '',
  });
  const [fotos, setFotos] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;
  useEffect(() => () => fotosRef.current.forEach((f) => URL.revokeObjectURL(f.preview)), []);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const agregarFotos = async (e) => {
    const archivos = Array.from(e.target.files || []);
    e.target.value = '';
    const disponibles = MAX_FOTOS_AVISO - fotos.length;
    if (!archivos.length || disponibles <= 0) return;

    setProcesando(true);
    try {
      const nuevas = [];
      for (const archivo of archivos.slice(0, disponibles)) {
        const file = await compressImage(archivo);
        nuevas.push({ file, preview: URL.createObjectURL(file) });
      }
      setFotos((prev) => [...prev, ...nuevas]);
    } catch (err) {
      showError('Imagen no válida', err.message);
    } finally {
      setProcesando(false);
    }
  };

  const quitarFoto = (index) => {
    setFotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!fotos.length) {
      showError('Falta la foto', 'Adjuntá al menos una foto de la mascota');
      return;
    }
    setEnviando(true);
    try {
      const data = new FormData();
      data.append('tipo', tipo);
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'nombre_mascota' && !esPerdido) return;
        if (k === 'resguardado' && esPerdido) return;
        data.append(k, v);
      });
      fotos.forEach((f) => data.append('imagenes', f.file));
      const res = await api.post('/perdidos', data);
      await showSuccess('¡Aviso enviado!', res.data.message);
      onSent?.();
    } catch (err) {
      showError('No se pudo enviar', err.response?.data?.message || 'Intentá de nuevo en unos minutos');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="card p-4 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg">
            {esPerdido ? 'Reportar mascota perdida' : 'Reportar mascota encontrada'}
          </h2>
          <p className="text-sm text-brown-soft">
            Un administrador del refugio revisa cada aviso antes de publicarlo.
          </p>
        </div>
        <button type="button" onClick={onCancel} className="p-2 -mr-2 text-brown-soft hover:text-brown-dark" aria-label="Cerrar formulario">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-brown-dark mb-1.5">
          Fotos * <span className="font-normal text-brown-soft">(hasta {MAX_FOTOS_AVISO})</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {fotos.map((f, i) => (
            <div key={f.preview} className="relative">
              <img src={f.preview} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => quitarFoto(i)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brown-dark text-white flex items-center justify-center"
                aria-label="Quitar foto"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {fotos.length < MAX_FOTOS_AVISO && (
            <label className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-cream-200 hover:border-terracotta/50 flex flex-col items-center justify-center gap-1 text-brown-soft cursor-pointer transition">
              <Camera className="w-6 h-6" />
              <span className="text-xs">{procesando ? 'Cargando…' : 'Agregar'}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={agregarFotos} disabled={procesando} />
            </label>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        <Select label="Especie *" options={AVISO_ESPECIE_OPTIONS} value={form.especie} onChange={set('especie')} />
        {esPerdido ? (
          <Input label="Nombre de la mascota" value={form.nombre_mascota} onChange={set('nombre_mascota')} maxLength={80} />
        ) : (
          <Select
            label="¿Dónde está ahora? *"
            options={[
              { value: 'true', label: 'La tengo resguardada' },
              { value: 'false', label: 'Sigue en la calle' },
            ]}
            value={form.resguardado}
            onChange={set('resguardado')}
          />
        )}
        <Input
          label={esPerdido ? 'Zona donde se perdió *' : 'Zona donde la encontraste *'}
          placeholder="Barrio, calle o referencia"
          value={form.zona}
          onChange={set('zona')}
          maxLength={150}
          required
        />
        <Input
          label={esPerdido ? '¿Cuándo se perdió? *' : '¿Cuándo la encontraste? *'}
          type="date"
          max={hoy()}
          value={form.fecha_evento}
          onChange={set('fecha_evento')}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brown-dark mb-1.5">Descripción *</label>
        <textarea
          className="input-field min-h-[90px]"
          placeholder="Color, tamaño, collar, señas particulares, comportamiento…"
          value={form.descripcion}
          onChange={set('descripcion')}
          maxLength={2000}
          required
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        <Input label="Tu nombre *" value={form.contacto_nombre} onChange={set('contacto_nombre')} maxLength={100} required />
        <Input
          label="Tu WhatsApp *"
          type="tel"
          inputMode="tel"
          placeholder="Ej: 11 0000-0000"
          value={form.contacto_telefono}
          onChange={set('contacto_telefono')}
          maxLength={30}
          required
        />
      </div>
      <p className="text-xs text-brown-soft -mt-2">
        Tu nombre y tu WhatsApp van a quedar visibles cuando el aviso se publique, para que puedan contactarte.
      </p>

      <div className="grid grid-cols-2 sm:flex gap-2">
        <Button type="submit" loading={enviando} disabled={procesando}>Enviar aviso</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
