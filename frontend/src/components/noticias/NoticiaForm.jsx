import { useEffect, useState } from 'react';
import { Camera, X } from 'lucide-react';
import api from '../../services/api';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { showError, showSuccess } from '../../utils/alerts';
import { compressImage } from '../../utils/imageCompression';
import { getImageUrl } from '../../utils/helpers';
import { NOTICIA_TIPO_OPTIONS } from '../../constants/noticias';

const vacio = {
  tipo: 'novedad',
  titulo: '',
  contenido: '',
  fecha_evento: '',
  horario: '',
  lugar: '',
  vigente_hasta: '',
  destacada: false,
  publicada: true,
};

export default function NoticiaForm({ noticia, onCancel, onSaved }) {
  const [form, setForm] = useState(() => (noticia
    ? {
      tipo: noticia.tipo,
      titulo: noticia.titulo,
      contenido: noticia.contenido,
      fecha_evento: noticia.fecha_evento || '',
      horario: noticia.horario || '',
      lugar: noticia.lugar || '',
      vigente_hasta: noticia.vigente_hasta || '',
      destacada: Boolean(noticia.destacada),
      publicada: Boolean(noticia.publicada),
    }
    : vacio));
  const [foto, setFoto] = useState(null);
  const [quitarImagen, setQuitarImagen] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => () => { if (foto) URL.revokeObjectURL(foto.preview); }, [foto]);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const setCheck = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.checked }));

  const elegirFoto = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setProcesando(true);
    try {
      const file = await compressImage(archivo);
      setFoto({ file, preview: URL.createObjectURL(file) });
      setQuitarImagen(false);
    } catch (err) {
      showError('Imagen no válida', err.message);
    } finally {
      setProcesando(false);
    }
  };

  const quitarFoto = () => {
    setFoto(null);
    setQuitarImagen(true);
  };

  const imagenActual = foto?.preview || (!quitarImagen && noticia?.imagen ? getImageUrl(noticia.imagen) : null);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, String(v)));
      if (foto) data.append('imagen', foto.file);
      if (quitarImagen && !foto) data.append('quitar_imagen', 'true');
      const res = noticia
        ? await api.put(`/noticias/admin/${noticia.id}`, data)
        : await api.post('/noticias/admin', data);
      showSuccess(res.data.message);
      onSaved?.();
    } catch (err) {
      showError('No se pudo guardar', err.response?.data?.message || 'Intentá de nuevo en unos minutos');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="card p-4 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-bold text-lg">{noticia ? 'Editar novedad' : 'Nueva novedad'}</h2>
        <button type="button" onClick={onCancel} className="p-2 -mr-2 text-brown-soft hover:text-brown-dark" aria-label="Cerrar formulario">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        <Select label="Tipo *" options={NOTICIA_TIPO_OPTIONS} value={form.tipo} onChange={set('tipo')} />
        <Input label="Título *" value={form.titulo} onChange={set('titulo')} maxLength={150} required />
      </div>

      <div>
        <label className="block text-sm font-medium text-brown-dark mb-1.5">Contenido *</label>
        <textarea
          className="input-field min-h-[120px]"
          placeholder="Contá de qué se trata, requisitos, costos, qué hay que llevar…"
          value={form.contenido}
          onChange={set('contenido')}
          maxLength={5000}
          required
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
        <Input label="Fecha del evento" type="date" value={form.fecha_evento} onChange={set('fecha_evento')} />
        <Input label="Horario" placeholder="Ej: 9 a 13 h" value={form.horario} onChange={set('horario')} maxLength={60} />
        <Input label="Lugar" placeholder="Ej: Plaza Central" value={form.lugar} onChange={set('lugar')} maxLength={150} />
      </div>

      <div>
        <Input
          label="Mostrar hasta"
          type="date"
          value={form.vigente_hasta}
          onChange={set('vigente_hasta')}
          className="sm:max-w-xs"
        />
        <p className="text-xs text-brown-soft mt-1">Después de esa fecha deja de mostrarse sola. Dejalo vacío si no vence.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brown-dark mb-1.5">Foto</label>
        {imagenActual ? (
          <div className="relative w-fit">
            <img src={imagenActual} alt="" className="h-28 sm:h-32 rounded-xl object-cover" />
            <button
              type="button"
              onClick={quitarFoto}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brown-dark text-white flex items-center justify-center"
              aria-label="Quitar foto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="w-24 h-24 rounded-xl border-2 border-dashed border-cream-200 hover:border-terracotta/50 flex flex-col items-center justify-center gap-1 text-brown-soft cursor-pointer transition">
            <Camera className="w-6 h-6" />
            <span className="text-xs">{procesando ? 'Cargando…' : 'Agregar'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={elegirFoto} disabled={procesando} />
          </label>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.destacada} onChange={setCheck('destacada')} className="w-4 h-4 accent-terracotta" />
          Destacada (aparece primero y en el inicio)
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.publicada} onChange={setCheck('publicada')} className="w-4 h-4 accent-terracotta" />
          Publicada (visible para todos)
        </label>
      </div>

      <div className="grid grid-cols-2 sm:flex gap-2">
        <Button type="submit" loading={guardando} disabled={procesando}>Guardar</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
