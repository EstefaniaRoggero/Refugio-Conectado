import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import useAsyncData from '../../hooks/useAsyncData';
import useTenantPath from '../../hooks/useTenantPath';
import { getImageUrl, formatDate } from '../../utils/helpers';
import { showSuccess, showError } from '../../utils/alerts';
import { validatePetImage } from '../../utils/imageValidation';
import {
  FRECUENCIA_OPTIONS,
  frecuenciaLabel,
  estadoReporteSeguimientoLabel,
  estadoReporteSeguimientoColor,
  estadoReporteItemLabel,
  estadoReporteItemColor,
} from '../../constants/seguimiento';

export default function SeguimientoDetalle() {
  const { id } = useParams();
  const tenantPath = useTenantPath();
  const [comentario, setComentario] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [enviando, setEnviando] = useState(false);

  const { data, loading, reload } = useAsyncData(
    () => api.get(`/seguimiento/${id}`).then((res) => res.data.data),
    [id]
  );

  const seguimiento = data?.seguimiento;
  const reportes = data?.reportes || [];

  const onSelectFiles = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    for (const f of files) {
      const v = validatePetImage(f);
      if (!v.valid) {
        showError('Imagen no válida', v.message);
        return;
      }
    }
    setArchivos(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const enviarReporte = async () => {
    if (!archivos.length && !comentario.trim()) {
      showError('Reporte vacío', 'Escribí un comentario o adjuntá al menos una foto');
      return;
    }
    setEnviando(true);
    try {
      const form = new FormData();
      archivos.forEach((f) => form.append('imagenes', f));
      if (comentario.trim()) form.append('comentario', comentario.trim());
      await api.post(`/seguimiento/${id}/reportes`, form);
      await showSuccess('¡Enviado!', 'El refugio recibió tu reporte');
      setComentario('');
      setArchivos([]);
      setPreviews([]);
      reload();
    } catch (err) {
      showError('Error', err.response?.data?.message || 'No se pudo enviar el reporte');
    } finally {
      setEnviando(false);
    }
  };

  const cambiarFrecuencia = async (e) => {
    try {
      await api.patch(`/seguimiento/${id}/frecuencia`, { frecuencia_reporte: e.target.value });
      showSuccess('Actualizado', 'Frecuencia de reportes modificada');
      reload();
    } catch (err) {
      showError('Error', err.response?.data?.message);
    }
  };

  if (loading) return <Loader />;
  if (!seguimiento) {
    return (
      <div className="text-center py-12">
        <p className="text-brown-soft">Seguimiento no encontrado</p>
        <Link to={tenantPath('panel/seguimiento')} className="text-terracotta mt-4 inline-block">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to={tenantPath('panel/seguimiento')}
        className="inline-flex items-center gap-2 text-brown-soft hover:text-terracotta mb-4 sm:mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al seguimiento
      </Link>

      <div className="card p-4 sm:p-6 mb-4 sm:mb-6 flex flex-wrap sm:flex-nowrap gap-4">
        <img
          src={getImageUrl(seguimiento.mascota_imagen)}
          alt={seguimiento.mascota_nombre}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-brown-dark break-words">{seguimiento.mascota_nombre}</h1>
          <p className="text-brown-soft capitalize text-sm">{seguimiento.mascota_tipo}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoReporteSeguimientoColor[seguimiento.estado_reporte]}`}>
              {estadoReporteSeguimientoLabel[seguimiento.estado_reporte]}
            </span>
            <span className="text-xs text-brown-soft self-center">
              Próximo reporte: {formatDate(seguimiento.proximo_reporte)}
            </span>
          </div>
        </div>
        <div className="w-full sm:w-56">
          <Select
            label="Frecuencia de fotos"
            value={seguimiento.frecuencia_reporte}
            onChange={cambiarFrecuencia}
            options={FRECUENCIA_OPTIONS}
          />
          <p className="text-xs text-brown-soft mt-1">
            Actual: {frecuenciaLabel[seguimiento.frecuencia_reporte]}
          </p>
        </div>
      </div>

      <div className="card p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="font-semibold text-lg mb-3 sm:mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-terracotta" />
          Enviar reporte
        </h2>
        <textarea
          className="input-field min-h-[80px] mb-4"
          placeholder="Comentario (¿cómo se adaptó esta semana?)"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
        <label className="flex flex-col items-center justify-center text-center border-2 border-dashed border-cream-200 rounded-xl p-4 sm:p-6 cursor-pointer hover:border-terracotta/50 transition mb-4">
          <ImageIcon className="w-8 h-8 text-brown-soft mb-2" />
          <span className="text-sm text-brown-soft">Fotos opcionales — hasta 5 imágenes (JPG o PNG)</span>
          <input type="file" accept=".jpg,.jpeg,.jfif,.png,image/jpeg,image/png" multiple className="hidden" onChange={onSelectFiles} />
        </label>
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {previews.map((src, i) => (
              <img key={i} src={src} alt="" className="w-20 h-20 rounded-lg object-cover" />
            ))}
          </div>
        )}
        <Button onClick={enviarReporte} loading={enviando} className="w-full sm:w-auto">
          Enviar reporte
        </Button>
      </div>

      <h2 className="font-semibold text-lg mb-4">Historial de reportes</h2>
      {reportes.length === 0 ? (
        <div className="card p-8 text-center text-brown-soft text-sm">
          Aún no enviaste reportes. ¡Contanos cómo está tu mascota!
        </div>
      ) : (
        <div className="space-y-4">
          {reportes.map((r) => (
            <div key={r.id} className="card p-4 sm:p-5">
              <div className="flex justify-between items-start gap-2 mb-3">
                <p className="text-sm text-brown-soft">{formatDate(r.created_at)}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoReporteItemColor[r.estado]}`}>
                  {estadoReporteItemLabel[r.estado]}
                </span>
              </div>
              {r.comentario && <p className="text-sm text-brown-dark mb-3">{r.comentario}</p>}
              {r.notas_admin && (
                <p className="text-sm text-terracotta-dark bg-terracotta/5 rounded-lg p-3 mb-3">
                  <strong>Refugio:</strong> {r.notas_admin}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {(r.imagenes || []).map((img) => (
                  <img
                    key={img.id}
                    src={getImageUrl(img.url)}
                    alt=""
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
