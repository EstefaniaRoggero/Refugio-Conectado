import { CalendarDays, Clock, User } from 'lucide-react';
import {
  DIAS_SEMANA,
  agruparTurnosPorDia,
  contarHorasCubiertas,
  contarVoluntariosUnicos,
  formatTurnoHorario,
} from '../../constants/voluntarioCalendario';

export default function VoluntarioCalendarioSemanal({
  turnos = [],
  showStats = true,
  editable = false,
  onRemove,
  emptyMessage = 'Sin turnos registrados este día',
}) {
  const porDia = agruparTurnosPorDia(turnos);
  const voluntariosActivos = contarVoluntariosUnicos(turnos);
  const horasCubiertas = contarHorasCubiertas(turnos);

  return (
    <div>
      {showStats && turnos.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 sm:mb-6 text-sm">
          <div className="flex items-center gap-2 text-brown-soft">
            <User className="w-4 h-4 text-terracotta" />
            <span><strong className="text-brown-dark">{voluntariosActivos}</strong> colaborador(es)</span>
          </div>
          <div className="flex items-center gap-2 text-brown-soft">
            <Clock className="w-4 h-4 text-terracotta" />
            <span><strong className="text-brown-dark">{horasCubiertas} h</strong> cubiertas por semana</span>
          </div>
          <div className="flex items-center gap-2 text-brown-soft">
            <CalendarDays className="w-4 h-4 text-terracotta" />
            <span><strong className="text-brown-dark">{turnos.length}</strong> turno(s)</span>
          </div>
        </div>
      )}

      <div className="pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {DIAS_SEMANA.map((dia) => {
            const items = porDia[dia.value];
            return (
              <div key={dia.value} className="lg:min-h-[120px]">
                <div className="text-center py-1.5 lg:py-2 px-1 rounded-t-xl bg-terracotta/10 border border-b-0 border-cream-200 dark:border-brown-dark/40">
                  <p className="text-xs font-bold text-terracotta uppercase tracking-wide">
                    {dia.label}
                  </p>
                </div>
                <div className="border border-cream-200 dark:border-brown-dark/40 rounded-b-xl p-2 lg:min-h-[100px] space-y-2 bg-warm-white dark:bg-brown-dark/20">
                  {items.length === 0 ? (
                    <p className="text-[11px] lg:text-[10px] text-brown-soft/70 text-center py-1 lg:py-4 leading-tight">
                      {emptyMessage}
                    </p>
                  ) : (
                    items.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-lg bg-cream-50 dark:bg-brown-dark/40 border border-cream-200 dark:border-brown-dark/50 p-2 text-left"
                      >
                        <p className="text-xs lg:text-[10px] font-semibold text-terracotta">
                          {formatTurnoHorario(t.hora_inicio, t.hora_fin)}
                        </p>
                        <p className="text-xs font-medium text-brown-dark mt-0.5 truncate" title={t.nombre}>
                          {t.nombre}
                        </p>
                        {(t.tarea || t.notas) && (
                          <p className="text-xs lg:text-[10px] text-brown-soft mt-0.5 line-clamp-2">
                            {t.tarea || t.notas}
                          </p>
                        )}
                        {editable && onRemove && (
                          <button
                            type="button"
                            onClick={() => onRemove(t)}
                            className="text-xs lg:text-[10px] text-red-500 hover:underline mt-1 py-1 lg:py-0"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
