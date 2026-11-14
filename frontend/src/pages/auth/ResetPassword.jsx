import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { showSuccess, showError } from '../../utils/alerts';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const { register, handleSubmit } = useForm({ defaultValues: { token: params.get('token') || '' } });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', data);
      await showSuccess('Listo', 'Contraseña restablecida');
      navigate('/login');
    } catch (err) {
      showError('Error', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center px-4 py-6">
      <div className="card max-w-md w-full p-5 sm:p-8">
        <h1 className="text-2xl font-bold mb-4">Nueva contraseña</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Token" {...register('token', { required: true })} />
          <Input label="Nueva contraseña" type="password" {...register('password', { required: true, minLength: 6 })} />
          <Button type="submit" className="w-full" loading={loading}>Restablecer</Button>
        </form>
        <Link to="/login" className="block text-center text-sm text-terracotta mt-4">Volver al login</Link>
      </div>
    </div>
  );
}
