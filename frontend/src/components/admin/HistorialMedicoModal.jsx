import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Stethoscope, X } from 'lucide-react';
import api from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Loader from '../ui/Loader';
import useAsyncData from '../../hooks/useAsyncData';
import { showConfirm, showError, showSuccess } from '../../utils/alerts';
import { formatDate } from '../../utils/helpers';
import {
  EMPTY_HISTORIAL_FORM,
  HISTORIAL_TIPO_OPTIONS,
  historialTipoLabel,
  mapHistorialToForm,
} from '../../constants/historialMedico';

export default function HistorialMedicoModal({ isOpen, mascota, onClose }) {
  const [form, setForm] = useState(EMPTY_HISTORIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, reload } = useAsyncData(
    () => {
      if (!isOpen || !mascota?.id) return Promise.resolve({ historial: [], proximasDosis: [] });
      return api.get(`/mascotas/${mascota.id}/historial-medico`).then((res) => res.data.data);
    },
    [isOpen, mascota?.id]
  );

  const historial = data?.historial || [];
  const proximasDosis = data?.proximasDosis || [];

  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_HISTORIAL_FORM);
      setEditingId(null);
    }
  }, [isOpen]);

  const resetForm = () => {
    setForm(EMPTY_HISTORIAL_FORM);
    setEditingId(null);
  };

  const startEdit = (h) => {
    setEditingId(h.id_historial);
    setForm(mapHistorialToForm(h));
  };

  const save = async () => {
    if (!form.procedimiento.trim() || !form.fecha) {
      showError('Datos incompletos', 'Procedimiento y fecha son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        tipo: form.tipo,
        procedimiento: form.procedimiento.trim(),
        descripcion: form.descripcion.trim() || null,
        fecha: form.fecha,
        veterinario: form.veterinario.trim() || null,
        proxima_dosis: form.proxima_dosis || null,
        lote: form.lote.trim() || null,
      };
      if (editingId) {
        await api.put(`/mascotas/historial-medico/${editingId}`, payload);
        showSuccess('Registro actualizado');
      } else {
        await api.post(`/mascotas/${mascota.id}/historial-medico`, payload);
        showSuccess('Registro agregado');
      }
      resetForm();
      reload();
    } catch (err) {
      showError('Error', err.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    const r = await showConfirm('¿Eliminar registro?', 'Esta acción no se puede deshacer');
    if (!r.isConfirmed) return;
    try {
      await api.delete(`/mascotas/historial-medico/${id}`);
      showSuccess('Registro eliminado');
      if (editingId === id) resetForm();
      reload();
    } catch (err) {
      showError('Error', err.response?.data?.message);
    }
  };

  if (!isOpen || !mascota) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
      <div className="card w-full max-w-2xl max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex items-start gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5 text-terracotta" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg">Historial médico</h2>
            <p className="text-sm text-brown-soft truncate">{mascota.nombre}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 -mt-1 text-brown-soft hover:text-brown-dark rounded-lg shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {proximasDosis.length > 0 && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">Próximas dosis / controles</p>
            <ul className="text-sm space-y-1 text-amber-800 dark:text-amber-200">
              {proximasDosis.map((p) => (
                <li key={p.id_historial}>
                  {historialTipoLabel[p.tipo]} — {p.procedimiento}: {formatDate(p.proxima_dosis)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border border-cream-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingId ? 'Editar registro' : 'Nuevo registro'}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Select
              label="Tipo"
              options={HISTORIAL_TIPO_OPTIONS}
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            />
            <Input
              label="Procedimiento"
              value={form.procedimiento}
              onChange={(e) => setForm({ ...form, procedimiento: e.target.value })}
              placeholder="Ej. Rabia, castración…"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label="Fecha"
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
            <Input
              label="Veterinario"
              value={form.veterinario}
              onChange={(e) => setForm({ ...form, veterinario: e.target.value })}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label="Próxima dosis / control"
              type="date"
              value={form.proxima_dosis}
              onChange={(e) => setForm({ ...form, proxima_dosis: e.target.value })}
            />
            <Input
              label="Lote (vacunas)"
              value={form.lote}
              onChange={(e) => setForm({ ...form, lote: e.target.value })}
            />
          </div>
          <textarea
            className="input-field min-h-[60px] text-sm"
            placeholder="Descripción u observaciones"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={save} loading={saving}>
              {editingId ? 'Guardar cambios' : 'Agregar registro'}
            </Button>
            {editingId && (
              <Button variant="secondary" onClick={resetForm}>Cancelar edición</Button>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-sm mb-3">Registros ({historial.length})</h3>
        {loading ? (
          <Loader />
        ) : historial.length === 0 ? (
          <p className="text-sm text-brown-soft text-center py-6">Sin registros médicos aún.</p>
        ) : (
          <div className="space-y-2 mb-6">
            {historial.map((h) => (
              <div
                key={h.id_historial}
                className="flex items-start justify-between gap-2 p-3 rounded-xl border border-cream-200 hover:border-terracotta/30 transition"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm break-words">
                    {historialTipoLabel[h.tipo]} — {h.procedimiento}
                  </p>
                  <p className="text-xs text-brown-soft mt-0.5">
                    {formatDate(h.fecha)}
                    {h.veterinario && ` · ${h.veterinario}`}
                    {h.proxima_dosis && ` · Próx.: ${formatDate(h.proxima_dosis)}`}
                  </p>
                  {h.descripcion && (
                    <p className="text-xs text-brown-soft mt-1">{h.descripcion}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(h)}
                    className="p-2 hover:bg-cream-100 rounded-lg"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(h.id_historial)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
          Cerrar
        </Button>
      </div>
    </div>
  );
}
