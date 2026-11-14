import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import useAuthStore from '../../context/authStore';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { showSuccess, showError } from '../../utils/alerts';

export default function Perfil() {
  const { user, updateUser } = useAuthStore();
  const { register, handleSubmit } = useForm({ defaultValues: user });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', data);
      updateUser(res.data.data.user);
      showSuccess('Perfil actualizado');
    } catch (err) {
      showError('Error', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Mi perfil</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-4 sm:p-8 max-w-lg space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Nombre" {...register('nombre')} />
          <Input label="Apellido" {...register('apellido')} />
        </div>
        <Input label="Email" value={user?.email} disabled className="opacity-60" />
        <Input label="Teléfono" {...register('telefono')} />
        <Input label="Dirección" {...register('direccion')} />
        <Select label="Tipo de vivienda" options={[
          { value: 'casa', label: 'Casa' },
          { value: 'departamento', label: 'Departamento' },
          { value: 'finca', label: 'Finca' },
        ]} {...register('tipo_vivienda')} />
        <div>
          <label className="block text-sm font-medium mb-1.5">Experiencia con mascotas</label>
          <textarea className="input-field min-h-[80px]" {...register('experiencia_mascotas')} />
        </div>
        <Button type="submit" loading={loading} className="w-full sm:w-auto">Guardar cambios</Button>
      </form>
    </div>
  );
}
