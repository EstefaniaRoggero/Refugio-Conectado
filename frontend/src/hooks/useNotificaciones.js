import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import useAuthStore from '../context/authStore';

const POLL_MS = 60_000;

export default function useNotificaciones() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  const fetchNotificaciones = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setNotificaciones([]);
      setNoLeidas(0);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/notificaciones');
      if (!mounted.current) return;
      setNotificaciones(res.data.data.notificaciones || []);
      setNoLeidas(res.data.data.no_leidas || 0);
    } catch {
      if (mounted.current) {
        setNotificaciones([]);
        setNoLeidas(0);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    mounted.current = true;
    fetchNotificaciones();
    if (!isAuthenticated) return undefined;

    const id = setInterval(fetchNotificaciones, POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [fetchNotificaciones, isAuthenticated, userId]);

  const marcarLeida = useCallback(async (id) => {
    await api.patch(`/notificaciones/${id}/leida`);
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: 1 } : n))
    );
    setNoLeidas((c) => Math.max(0, c - 1));
  }, []);

  const marcarTodasLeidas = useCallback(async () => {
    const pendientes = notificaciones.filter((n) => !n.leida);
    if (!pendientes.length) return;
    await Promise.all(pendientes.map((n) => api.patch(`/notificaciones/${n.id}/leida`)));
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: 1 })));
    setNoLeidas(0);
  }, [notificaciones]);

  return {
    notificaciones,
    noLeidas,
    loading,
    reload: fetchNotificaciones,
    marcarLeida,
    marcarTodasLeidas,
  };
}
