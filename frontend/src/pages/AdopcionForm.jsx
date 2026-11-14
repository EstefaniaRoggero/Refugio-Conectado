import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import useAuthStore from '../context/authStore';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import { showSuccess, showError } from '../utils/alerts';
import { getImageUrl } from '../utils/helpers';
import useTenantPath from '../hooks/useTenantPath';

export default function AdopcionForm() {
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const tenantPath = useTenantPath();
  const { register, handleSubmit } = useForm();
  const [mascota, setMascota] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate(tenantPath('login'), { state: { from: { pathname: tenantPath(`adoptar/${id}`) } } });
    api.get(`/mascotas/${id}`).then((res) => setMascota(res.data.data.mascota));
  }, [id, isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/adopciones', { ...data, mascota_id: parseInt(id, 10) });
      await showSuccess('¡Solicitud enviada!', 'Revisaremos tu solicitud pronto');
      navigate(tenantPath('panel/solicitudes'));
    } catch (err) {
      showError('Error', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mascota) return <Loader fullScreen />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-12">
      <h1 className="section-title mb-3 sm:mb-4">Solicitud de adopción</h1>
      <div className="card p-3 sm:p-4 flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
        <img src={getImageUrl(mascota.imagen)} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-lg">{mascota.nombre}</p>
          <p className="text-brown-soft text-sm capitalize">{mascota.tipo} • {mascota.tamano}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-4 sm:p-8 space-y-4">
        <h2 className="font-semibold text-lg">Información del hogar</h2>
        <Select label="Tipo de vivienda" options={[
          { value: 'casa', label: 'Casa' },
          { value: 'departamento', label: 'Departamento' },
          { value: 'finca', label: 'Finca' },
        ]} {...register('tipo_vivienda', { required: true })} />
        <Input label="Tiempo disponible diario" placeholder="Ej: 4 horas" {...register('tiempo_disponible', { required: true })} />
        <div>
          <label className="block text-sm font-medium mb-1.5">Experiencia previa con mascotas</label>
          <textarea className="input-field min-h-[80px]" {...register('experiencia_previa')} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Motivo de adopción *</label>
          <textarea className="input-field min-h-[80px]" {...register('motivo_adopcion', { required: true })} />
        </div>
        <Input label="¿Tienes otras mascotas?" placeholder="Describe o escribe 'No'" {...register('otras_mascotas')} />
        <Input label="Información económica (capacidad para cuidados)" {...register('info_economica')} />
        <Button type="submit" className="w-full" loading={loading}>Enviar solicitud</Button>
      </form>
    </div>
  );
}
