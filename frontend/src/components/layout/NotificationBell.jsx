import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import useAuthStore from '../../context/authStore';
import useTenantPath from '../../hooks/useTenantPath';
import useNotificaciones from '../../hooks/useNotificaciones';
import { NOTIFICACION_TIPO_ICON, notificacionDestino } from '../../constants/notificaciones';

function formatNotifDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

const MOBILE_QUERY = '(max-width: 639px)';

export default function NotificationBell({ onOpen }) {
  const { isAuthenticated, user } = useAuthStore();
  const tenantPath = useTenantPath();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const panelRef = useRef(null);
  const mobilePanelRef = useRef(null);
  const { notificaciones, noLeidas, loading, marcarLeida, marcarTodasLeidas, reload } = useNotificaciones();

  useEffect(() => {
    if (!isAuthenticated) setOpen(false);
  }, [isAuthenticated]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      const dentro = panelRef.current?.contains(e.target) || mobilePanelRef.current?.contains(e.target);
      if (!dentro) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!isAuthenticated) return null;

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) {
      onOpen?.();
      reload();
    }
  };

  const handleClickNotif = async (n) => {
    if (!n.leida) await marcarLeida(n.id);
    const dest = notificacionDestino(n.tipo, user?.rol);
    setOpen(false);
    navigate(tenantPath(dest));
  };

  const panelClases = 'overflow-hidden rounded-2xl border border-cream-200 dark:border-brown-dark/50 bg-warm-white dark:bg-brown-dark shadow-lg flex flex-col';

  const contenido = (
    <>
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-cream-200 dark:border-brown-dark/50">
            <p className="font-semibold text-sm">Notificaciones</p>
            <div className="flex items-center gap-2">
              {noLeidas > 0 && (
                <button
                  type="button"
                  onClick={marcarTodasLeidas}
                  className="text-xs text-terracotta hover:underline"
                >
                  Marcar todas leídas
                </button>
              )}
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 -mr-1.5 rounded-lg text-brown-soft hover:bg-cream-200 dark:hover:bg-brown-dark/60"
                  aria-label="Cerrar notificaciones"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 overscroll-contain">
            {loading && notificaciones.length === 0 ? (
              <p className="p-6 text-center text-sm text-brown-soft">Cargando…</p>
            ) : notificaciones.length === 0 ? (
              <p className="p-6 text-center text-sm text-brown-soft">No tenés notificaciones</p>
            ) : (
              <ul>
                {notificaciones.map((n) => {
                  const Icon = NOTIFICACION_TIPO_ICON[n.tipo] || Bell;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleClickNotif(n)}
                        className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-cream-100 dark:hover:bg-brown-dark/40 transition border-b border-cream-100 dark:border-brown-dark/30 last:border-0 ${
                          !n.leida ? 'bg-terracotta/5' : ''
                        }`}
                      >
                        <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${!n.leida ? 'bg-terracotta/15 text-terracotta' : 'bg-cream-200 dark:bg-brown-dark/60 text-brown-soft'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm break-words sm:truncate ${!n.leida ? 'font-semibold' : 'font-medium'}`}>
                            {n.titulo}
                          </p>
                          <p className="text-xs text-brown-soft line-clamp-3 sm:line-clamp-2 mt-0.5 break-words">{n.mensaje}</p>
                          <p className="text-[10px] text-brown-soft/80 mt-1">{formatNotifDate(n.created_at)}</p>
                        </div>
                        {!n.leida && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-terracotta mt-2" aria-hidden />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
    </>
  );

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-cream-200 dark:hover:bg-brown-dark/60 transition"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-terracotta text-white text-[10px] font-bold">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && !isMobile && (
        <div className={`absolute right-0 mt-2 w-96 max-h-[min(70vh,420px)] z-50 ${panelClases}`}>
          {contenido}
        </div>
      )}

      {open && isMobile && createPortal(
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-start justify-center px-3 pt-20 pb-6">
          <div
            ref={mobilePanelRef}
            role="dialog"
            aria-label="Notificaciones"
            className={`w-full max-w-md max-h-full ${panelClases}`}
          >
            {contenido}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
