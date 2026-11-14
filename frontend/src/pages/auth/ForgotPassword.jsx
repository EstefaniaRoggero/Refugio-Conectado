import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { showSuccess, showError } from '../../utils/alerts';

export default function ForgotPassword() {
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', data);
      if (res.data.data?.resetToken) setToken(res.data.data.resetToken);
      showSuccess('Enviado', res.data.message);
    } catch (err) {
      showError('Error', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center px-4 py-6">
      <div className="card max-w-md w-full p-5 sm:p-8">
        <h1 className="text-2xl font-bold mb-4">Recuperar contraseña</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Correo electrónico" type="email" {...register('email', { required: true })} />
          <Button type="submit" className="w-full" loading={loading}>Enviar instrucciones</Button>
        </form>
        {token && (
          <div className="mt-4 p-4 bg-cream-100 rounded-xl text-sm">
            <p className="font-medium mb-2">Token de desarrollo:</p>
            <Link to={`/restablecer-password?token=${token}`} className="text-terracotta break-all">{token}</Link>
          </div>
        )}
        <Link to="/login" className="block text-center text-sm text-terracotta mt-4">Volver al login</Link>
      </div>
    </div>
  );
}
