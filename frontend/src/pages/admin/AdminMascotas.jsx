import { useState } from 'react';
import { Plus, Pencil, Trash2, QrCode, Stethoscope } from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import MascotaFormModal from '../../components/admin/MascotaFormModal';
import MascotaQrModal from '../../components/mascotas/MascotaQrModal';
import HistorialMedicoModal from '../../components/admin/HistorialMedicoModal';
import useAsyncData from '../../hooks/useAsyncData';
import useTenantStore from '../../context/tenantStore';
import { showConfirm, showSuccess } from '../../utils/alerts';
import { getImageUrl, formatTiempoEnRefugio } from '../../utils/helpers';

function tiempoEsperaAdmin(m) {
  if (m.estado === 'adoptado') return { texto: '—', alerta: false };
  const dias = m.dias_en_refugio ?? 0;
  return {
    texto: formatTiempoEnRefugio(dias),
    alerta: dias >= 60,
    critico: dias >= 120,
  };
}

function EsperaBadge({ mascota }) {
  if (mascota.estado === 'adoptado') return <span className="text-brown-soft">—</span>;
  const espera = tiempoEsperaAdmin(mascota);
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
        espera.critico
          ? 'bg-red-100 text-red-700'
          : espera.alerta
            ? 'bg-amber-100 text-amber-800'
            : 'bg-cream-100 text-brown-soft'
      }`}
      title={`Ingresó: ${mascota.fecha_ingreso || mascota.created_at?.slice?.(0, 10) || '—'}`}
    >
      {espera.texto}
    </span>
  );
}

function AccionesMascota({ onHistorial, onQr, onEdit, onRemove }) {
  return (
    <div className="flex gap-1 sm:gap-2">
      <button type="button" onClick={onHistorial} className="p-2 hover:bg-cream-100 rounded-lg text-emerald-700" title="Historial médico" aria-label="Historial médico">
        <Stethoscope className="w-4 h-4" />
      </button>
      <button type="button" onClick={onQr} className="p-2 hover:bg-cream-100 rounded-lg text-terracotta" title="Ver y descargar QR" aria-label="QR">
        <QrCode className="w-4 h-4" />
      </button>
      <button type="button" onClick={onEdit} className="p-2 hover:bg-cream-100 rounded-lg" title="Editar" aria-label="Editar">
        <Pencil className="w-4 h-4" />
      </button>
      <button type="button" onClick={onRemove} className="p-2 hover:bg-red-50 text-red-500 rounded-lg" title="Eliminar" aria-label="Eliminar">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AdminMascotas() {
  const { slug } = useTenantStore();
  const { data: mascotas = [], loading, reload } = useAsyncData(
    () => api.get('/mascotas', { params: { admin: true, limit: 50 } })
      .then((res) => res.data.data.mascotas),
    []
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [qrMascota, setQrMascota] = useState(null);
  const [historialMascota, setHistorialMascota] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setModalOpen(true);
  };

  const remove = async (id) => {
    const r = await showConfirm('¿Eliminar mascota?', 'Esta acción no se puede deshacer');
    if (r.isConfirmed) {
      await api.delete(`/mascotas/${id}`);
      showSuccess('Eliminada');
      reload();
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
        <h1 className="text-xl sm:text-2xl font-bold">Gestión de Mascotas</h1>
        <Button onClick={openCreate} className="!px-4 sm:!px-6"><Plus className="w-4 h-4" /> Nueva mascota</Button>
      </div>
      <p className="text-sm text-brown-soft mb-4 sm:mb-6">
        Las no adoptadas se ordenan por mayor tiempo en el refugio. Los colores indican urgencia de adopción.
      </p>

      <div className="md:hidden space-y-3">
        {mascotas.map((m) => (
          <div key={m.id} className="card p-3">
            <div className="flex items-center gap-3">
              <img src={getImageUrl(m.imagen)} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{m.nombre}</p>
                <p className="text-xs text-brown-soft capitalize">{m.tipo} · {m.estado}</p>
              </div>
              <EsperaBadge mascota={m} />
            </div>
            <div className="flex justify-end mt-2 pt-2 border-t border-cream-200">
              <AccionesMascota
                onHistorial={() => setHistorialMascota(m)}
                onQr={() => setQrMascota(m)}
                onEdit={() => openEdit(m)}
                onRemove={() => remove(m.id)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-cream-100">
            <tr>
              <th className="p-3 text-left">Mascota</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Tiempo en refugio</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mascotas.map((m) => (
              <tr key={m.id} className="border-t border-cream-200">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={getImageUrl(m.imagen)} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    {m.nombre}
                  </div>
                </td>
                <td className="p-3 capitalize">{m.tipo}</td>
                <td className="p-3 capitalize">{m.estado}</td>
                <td className="p-3"><EsperaBadge mascota={m} /></td>
                <td className="p-3">
                  <AccionesMascota
                    onHistorial={() => setHistorialMascota(m)}
                    onQr={() => setQrMascota(m)}
                    onEdit={() => openEdit(m)}
                    onRemove={() => remove(m.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MascotaFormModal
        isOpen={modalOpen}
        mascota={editing}
        onClose={() => setModalOpen(false)}
        onSaved={reload}
      />

      {qrMascota && slug && (
        <MascotaQrModal
          mascota={qrMascota}
          slug={slug}
          onClose={() => setQrMascota(null)}
        />
      )}

      <HistorialMedicoModal
        isOpen={!!historialMascota}
        mascota={historialMascota}
        onClose={() => setHistorialMascota(null)}
      />
    </div>
  );
}
