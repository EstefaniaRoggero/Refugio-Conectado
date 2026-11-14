import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ContactInfo from '../components/shared/ContactInfo';
import { RefugioMap } from '../components/map/RefugiosMap';
import useTenantStore from '../context/tenantStore';
import { showSuccess, showError } from '../utils/alerts';

export default function Contacto() {
  const { register, handleSubmit, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const { refugio } = useTenantStore();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/mensajes', data);
      await showSuccess('¡Mensaje enviado!', 'Te responderemos pronto');
      reset();
    } catch (err) {
      showError('Error', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-12 grid lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="min-w-0">
        <h1 className="section-title mb-3 sm:mb-4">Contáctanos</h1>
        <p className="text-brown-soft mb-6 sm:mb-8">¿Tienes preguntas sobre adopción, donaciones o voluntariado? Escríbenos.</p>
        <ContactInfo />
        <div className="mt-6 sm:mt-8">
          <h2 className="font-semibold text-brown-dark mb-3">Ubicación</h2>
          <RefugioMap refugio={refugio} />
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-4 sm:p-8 space-y-4 h-fit">
        <Input label="Nombre" {...register('nombre', { required: true })} />
        <Input label="Email" type="email" {...register('email', { required: true })} />
        <Input label="Asunto" {...register('asunto', { required: true })} />
        <div>
          <label className="block text-sm font-medium mb-1.5">Mensaje</label>
          <textarea className="input-field min-h-[120px]" {...register('mensaje', { required: true })} />
        </div>
        <Button type="submit" className="w-full" loading={loading}>Enviar mensaje</Button>
      </form>
    </div>
  );
}
