import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../context/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { showError } from '../../utils/alerts';

export default function SuperAdminLogin() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const submit = async (values) => {
    setLoading(true);
    try {
      const { data } = await api.post('/super-admin/login', values);
      setAuth(data.data.user, data.data.token);
      navigate('/backoffice');
    } catch (err) {
      showError('Acceso denegado', err.response?.data?.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 to-warm-white flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-5 sm:p-8">
        <div className="w-12 h-12 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center mb-5"><ShieldCheck /></div>
        <h1 className="text-2xl font-bold">Backoffice global</h1>
        <p className="text-sm text-brown-soft mt-1 mb-6">Acceso exclusivo para superadministradores.</p>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <Input label="Correo" type="email" error={errors.email?.message} {...register('email', { required: 'Ingresá el correo' })} />
          <Input label="Contraseña" type="password" error={errors.password?.message} {...register('password', { required: 'Ingresá la contraseña' })} />
          <Button type="submit" loading={loading} className="w-full">Ingresar</Button>
        </form>
      </div>
    </div>
  );
}

