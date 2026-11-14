import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Shield, Users } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../context/authStore';
import useTenantPath from '../../hooks/useTenantPath';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import GoogleSignIn from '../../components/auth/GoogleSignIn';
import ChangeRefugioLink from '../../components/layout/ChangeRefugioLink';
import { showError, showSuccess } from '../../utils/alerts';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const tenantPath = useTenantPath();

  const onSubmitAdmin = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      if (!['admin', 'super_admin'].includes(res.data.data.user.rol)) {
        showError('Acceso denegado', 'Este formulario es solo para administradores');
        return;
      }
      setAuth(res.data.data.user, res.data.data.token);
      await showSuccess('¡Bienvenido!', `Hola, ${res.data.data.user.nombre}`);
      navigate(res.data.data.user.rol === 'super_admin' ? '/backoffice' : tenantPath('admin'));
    } catch (err) {
      showError('Error', err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-6 sm:py-12">
      <ChangeRefugioLink
        className="md:hidden self-start mb-4 flex items-center gap-2 text-brown-soft hover:text-terracotta text-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl grid md:grid-cols-2 gap-4 sm:gap-6"
      >
        {/* Usuarios — Google */}
        <div className="card p-5 sm:p-8">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-terracotta" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brown-dark">Soy adoptante / donante</h2>
              <p className="text-sm text-brown-soft">Ingresa con tu cuenta de Gmail</p>
            </div>
          </div>
          <GoogleSignIn />
        </div>

        {/* Admin — email y contraseña */}
        <div className="card p-5 sm:p-8 border-2 border-terracotta/20">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="w-10 h-10 rounded-xl bg-brown-dark/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-brown-dark" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brown-dark">Administrador</h2>
              <p className="text-sm text-brown-soft">Acceso interno del refugio</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmitAdmin)} className="space-y-4">
            <Input
              label="Correo institucional"
              type="email"
              error={errors.email?.message}
              {...register('email', { required: 'El correo es obligatorio' })}
            />
            <Input
              label="Contraseña"
              type="password"
              error={errors.password?.message}
              {...register('password', { required: 'La contraseña es obligatoria' })}
            />
            <div className="text-right">
              <Link to={tenantPath('recuperar-password')} className="text-sm text-terracotta hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              Ingresar como administrador
            </Button>
          </form>

        </div>
      </motion.div>

      <ChangeRefugioLink
        className="hidden md:flex fixed top-24 left-4 items-center gap-2 text-brown-soft hover:text-terracotta text-sm z-10"
      />
    </div>
  );
}
