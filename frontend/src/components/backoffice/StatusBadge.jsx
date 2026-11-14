const colors = {
  activo: 'bg-green-100 text-green-700', activa: 'bg-green-100 text-green-700', aprobada: 'bg-green-100 text-green-700',
  pendiente: 'bg-amber-100 text-amber-700', borrador: 'bg-blue-100 text-blue-700', pausado: 'bg-amber-100 text-amber-700',
  inactivo: 'bg-gray-100 text-gray-600', bloqueado: 'bg-red-100 text-red-700', rechazada: 'bg-red-100 text-red-700', finalizado: 'bg-gray-100 text-gray-600',
};

export default function StatusBadge({ value, children }) {
  const key = String(value || '').toLowerCase();
  return <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${colors[key] || 'bg-cream-100 text-brown-soft'}`}>{children || value || '—'}</span>;
}
