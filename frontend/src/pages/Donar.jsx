import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Building2, Wallet, Heart, History, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import HistorialDonaciones from '../components/donaciones/HistorialDonaciones';
import { showSuccess, showError } from '../utils/alerts';
import { formatCurrency, formatDate } from '../utils/helpers';

const metodos = [
  { id: 'mercadopago', label: 'MercadoPago', icon: Wallet },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { id: 'transferencia', label: 'Transferencia', icon: Building2 },
];

export default function Donar() {
  const { register, handleSubmit, watch, setValue } = useForm({ defaultValues: { tipo: 'unica', metodo_pago: 'mercadopago', monto: 50000 } });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalRecaudado: 0, recientes: [] });
  const [searchParams, setSearchParams] = useSearchParams();
  const verHistorial = searchParams.get('vista') === 'historial';
  const metodo = watch('metodo_pago');
  const tipo = watch('tipo');

  const cambiarVista = (historial) => {
    setSearchParams(historial ? { vista: 'historial' } : {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    api.get('/donaciones/publicas').then((res) => setStats(res.data.data));
  }, []);

  const montos = tipo === 'mensual' ? [10000, 25000, 50000] : [25000, 50000, 100000, 200000];

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/donaciones', { ...data, monto: parseFloat(data.monto) });
      await showSuccess('¡Gracias!', 'Tu donación ha sido registrada exitosamente');
      const res = await api.get('/donaciones/publicas');
      setStats(res.data.data);
    } catch (err) {
      showError('Error', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  if (verHistorial) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-8">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 sm:w-7 sm:h-7 text-terracotta" />
            <h1 className="text-xl sm:text-2xl font-bold">Mis donaciones</h1>
          </div>
          <Button variant="outline" onClick={() => cambiarVista(false)}>
            <ArrowLeft className="w-4 h-4" /> Hacer una donación
          </Button>
        </div>
        <HistorialDonaciones />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-12">
      <div className="flex justify-end mb-2 sm:mb-0">
        <Button variant="outline" onClick={() => cambiarVista(true)}>
          <History className="w-4 h-4" /> Mis donaciones
        </Button>
      </div>
      <div className="text-center mb-6 sm:mb-12">
        <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-terracotta mx-auto mb-3 sm:mb-4" />
        <h1 className="section-title mb-2">Haz una donación</h1>
        <p className="section-subtitle mx-auto">Tu aporte alimenta, cura y da esperanza a nuestros rescatados</p>
        <p className="text-2xl sm:text-3xl font-bold text-terracotta mt-3 sm:mt-4">{formatCurrency(stats.totalRecaudado)} recaudados</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 card p-4 sm:p-8 space-y-5 sm:space-y-6">
          <div className="flex gap-2 sm:gap-4">
            {['unica', 'mensual'].map((t) => (
              <button key={t} type="button" onClick={() => setValue('tipo', t)}
                className={`flex-1 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl font-medium capitalize transition ${tipo === t ? 'bg-terracotta text-white' : 'bg-cream-100 text-brown-soft'}`}>
                Donación {t === 'unica' ? 'única' : 'mensual'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Monto</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {montos.map((m) => (
                <button key={m} type="button" onClick={() => setValue('monto', m)}
                  className="px-4 py-2 rounded-xl bg-cream-100 hover:bg-terracotta hover:text-white transition text-sm font-medium">
                  {formatCurrency(m)}
                </button>
              ))}
            </div>
            <Input type="number" {...register('monto', { required: true, min: 1000 })} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Método de pago (simulado)</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {metodos.map((m) => (
                <button key={m.id} type="button" onClick={() => setValue('metodo_pago', m.id)}
                  className={`p-2.5 sm:p-4 rounded-xl border-2 flex flex-col items-center gap-1.5 sm:gap-2 transition ${metodo === m.id ? 'border-terracotta bg-terracotta/5' : 'border-cream-200'}`}>
                  <m.icon className="w-5 h-5 sm:w-6 sm:h-6 text-terracotta" />
                  <span className="text-xs sm:text-sm font-medium text-center">{m.label}</span>
                </button>
              ))}
            </div>
            <input type="hidden" {...register('metodo_pago')} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Nombre" {...register('nombre_donante')} />
            <Input label="Email" type="email" {...register('email_donante')} />
          </div>

          <Button type="submit" className="w-full" loading={loading}>Donar ahora</Button>
        </motion.form>

        <div className="card p-4 sm:p-6 h-fit">
          <h3 className="font-semibold mb-4">Donantes recientes</h3>
          {stats.recientes?.length ? stats.recientes.map((d, i) => (
            <div key={i} className="flex justify-between gap-3 py-3 border-b border-cream-200 last:border-0 text-sm">
              <span className="truncate">{d.nombre_donante}</span>
              <span className="text-terracotta font-medium shrink-0">{formatCurrency(d.monto)}</span>
            </div>
          )) : <p className="text-brown-soft text-sm">Sé el primero en donar</p>}
        </div>
      </div>
    </div>
  );
}
