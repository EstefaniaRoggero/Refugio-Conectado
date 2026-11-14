import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import api from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { showError } from '../../utils/alerts';

export default function ActivateAdmin() {
  const { token } = useParams();
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false); const [role, setRole] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return showError('Contraseña muy corta', 'Usá al menos 8 caracteres.');
    if (password !== confirm) return showError('Las contraseñas no coinciden');
    setLoading(true);
    try { const response = await api.post('/super-admin/activar', { token, password }); setRole(response.data.data.rol); }
    catch (err) { showError('No se pudo activar', err.response?.data?.message || 'La invitación no es válida'); }
    finally { setLoading(false); }
  };
  return <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4"><div className="card w-full max-w-md p-5 sm:p-8"><KeyRound className="w-10 h-10 text-terracotta mb-4" />
    {role ? <><h1 className="text-2xl font-bold">Acceso configurado</h1><p className="text-brown-soft text-sm mt-2 mb-6">Tu contraseña quedó guardada. Ya podés iniciar sesión.</p><Link to={role === 'super_admin' ? '/backoffice/login' : '/'} className="btn-primary w-full">Continuar</Link></> : <><h1 className="text-2xl font-bold">Activar acceso</h1><p className="text-brown-soft text-sm mt-2 mb-6">Creá una contraseña privada para tu cuenta administrativa.</p><form onSubmit={submit} className="space-y-4"><Input label="Nueva contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /><Input label="Repetir contraseña" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /><Button type="submit" loading={loading} className="w-full">Configurar contraseña</Button></form></>}
  </div></div>;
}

