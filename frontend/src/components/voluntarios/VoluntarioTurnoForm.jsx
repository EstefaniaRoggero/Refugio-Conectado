import { useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../../services/api';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Input from '../ui/Input';
import { showError, showSuccess } from '../../utils/alerts';
import { DIAS_SEMANA, EMPTY_TURNO_FORM } from '../../constants/voluntarioCalendario';

export default function VoluntarioTurnoForm({
  onSaved,
  voluntariosAprobados = [],
  adminMode = false,
}) {
  const [form, setForm] = useState(EMPTY_TURNO_FORM);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (adminMode && !form.id_voluntario) {
      showError('Falta voluntario', 'Seleccioná un voluntario aprobado');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        dia_semana: Number(form.dia_semana),
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
        notas: form.notas.trim() || undefined,
      };
      if (adminMode) payload.id_voluntario = Number(form.id_voluntario);
      await api.post('/voluntarios/turnos', payload);
      showSuccess('Turno agregado al calendario');
      setForm((f) => ({ ...EMPTY_TURNO_FORM, id_voluntario: f.id_voluntario }));
      onSaved?.();
    } catch (err) {
      showError('Error', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-5 space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Plus className="w-4 h-4 text-terracotta" />
        {adminMode ? 'Asignar turno a voluntario' : 'Registrar mi horario de colaboración'}
      </h3>

      {adminMode && (
        <Select
          label="Voluntario aprobado"
          value={form.id_voluntario}
          onChange={(e) => setForm({ ...form, id_voluntario: e.target.value })}
          options={[
            { value: '', label: 'Seleccionar…' },
            ...voluntariosAprobados.map((v) => ({
              value: String(v.id),
              label: `${v.nombre} ${v.apellido}`,
            })),
          ]}
        />
      )}

      <Select
        label="Día de la semana"
        value={form.dia_semana}
        onChange={(e) => setForm({ ...form, dia_semana: e.target.value })}
        options={DIAS_SEMANA.map((d) => ({ value: d.value, label: d.label }))}
      />

      <div className="grid sm:grid-cols-2 gap-3">
        <Input
          label="Desde"
          type="time"
          value={form.hora_inicio}
          onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
        />
        <Input
          label="Hasta"
          type="time"
          value={form.hora_fin}
          onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
        />
      </div>

      <Input
        label="Notas (opcional)"
        value={form.notas}
        onChange={(e) => setForm({ ...form, notas: e.target.value })}
        placeholder="Ej. Paseo, limpieza, eventos…"
      />

      <Button type="submit" loading={loading} className="w-full sm:w-auto">
        Agregar al calendario
      </Button>
    </form>
  );
}
