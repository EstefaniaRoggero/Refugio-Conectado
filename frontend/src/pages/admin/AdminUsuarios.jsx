import api from '../../services/api';
import Loader from '../../components/ui/Loader';
import useAsyncData from '../../hooks/useAsyncData';
import { formatDate } from '../../utils/helpers';

export default function AdminUsuarios() {
  const { data: usuarios = [], loading } = useAsyncData(
    () => api.get('/admin/usuarios').then((res) => res.data.data.usuarios),
    []
  );

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Usuarios</h1>
      <div className="md:hidden space-y-2">
        {usuarios.map((u) => (
          <div key={u.id} className="card p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{u.nombre} {u.apellido}</p>
              <p className="text-xs text-brown-soft truncate">{u.email}</p>
              <p className="text-xs text-brown-soft mt-0.5">Registro: {formatDate(u.created_at)}</p>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-full bg-cream-100 text-xs font-medium capitalize">{u.rol}</span>
          </div>
        ))}
      </div>
      <div className="card overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-cream-100">
            <tr>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Acceso</th>
              <th className="p-3 text-left">Registro</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-cream-200">
                <td className="p-3">{u.nombre} {u.apellido}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 capitalize">{u.rol}</td>
                <td className="p-3">{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
