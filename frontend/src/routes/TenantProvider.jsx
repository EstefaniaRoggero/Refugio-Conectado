import { useParams, Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import useTenantStore from '../context/tenantStore';
import Loader from '../components/ui/Loader';
import LunaWhatsAppWidget from '../components/luna/LunaWhatsAppWidget';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function TenantProvider() {
  const { slug } = useParams();
  const { refugio, setRefugio } = useTenantStore();
  const [loading, setLoading] = useState(!refugio || refugio.slug !== slug);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (refugio?.slug === slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    axios.get(`${API_URL}/refugios/${slug}`)
      .then(({ data }) => {
        setRefugio(data.data.refugio);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug, refugio?.slug, setRefugio]);

  if (loading) return <Loader fullScreen text="Cargando refugio..." />;
  if (error || !refugio) return <Navigate to="/" replace />;

  return (
    <>
      <Outlet />
      <LunaWhatsAppWidget />
    </>
  );
}
