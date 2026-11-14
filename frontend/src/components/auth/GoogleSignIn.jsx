import { useEffect, useRef } from 'react';
import { useGoogleOAuth } from '@react-oauth/google';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../context/authStore';
import { showError, showSuccess } from '../../utils/alerts';
import useTenantPath from '../../hooks/useTenantPath';
import {
  ensureGoogleIdInitialized,
  registerGoogleCredentialHandler,
  renderGoogleSignInButton,
} from '../../utils/googleGsi';

const BUTTON_OPTS = {
  type: 'standard',
  theme: 'outline',
  size: 'large',
  text: 'continue_with',
  shape: 'pill',
  locale: 'es',
};

export default function GoogleSignIn() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const tenantPath = useTenantPath();
  const from = location.state?.from?.pathname || tenantPath('panel');
  const btnRef = useRef(null);
  const { clientId, scriptLoadedSuccessfully } = useGoogleOAuth();

  const clientIdEnv = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!scriptLoadedSuccessfully || !clientId) return undefined;

    const handleCredential = async (response) => {
      if (!response?.credential) {
        showError('Error', 'No se pudo conectar con Google');
        return;
      }
      try {
        const res = await api.post('/auth/google', { credential: response.credential });
        setAuth(res.data.data.user, res.data.data.token);
        await showSuccess('¡Bienvenido!', `Hola, ${res.data.data.user.nombre}`);
        navigate(from);
      } catch (err) {
        showError('Error', err.response?.data?.message || 'No se pudo iniciar sesión con Google');
      }
    };

    const unregister = registerGoogleCredentialHandler(handleCredential);

    if (ensureGoogleIdInitialized(clientId) && btnRef.current) {
      renderGoogleSignInButton(btnRef.current, BUTTON_OPTS);
    }

    return () => {
      unregister();
      if (btnRef.current) btnRef.current.innerHTML = '';
    };
  }, [scriptLoadedSuccessfully, clientId, setAuth, navigate, from]);

  if (!clientIdEnv) {
    return (
      <div className="p-4 rounded-xl bg-orange-soft/30 text-sm text-brown-dark text-center">
        Configura <code className="text-xs">VITE_GOOGLE_CLIENT_ID</code> en <code className="text-xs">frontend/.env</code>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={btnRef} style={{ minHeight: 40 }} />
      <p className="text-xs text-brown-soft text-center">
        Usa tu cuenta de Gmail. Si es tu primera vez, se creará tu perfil automáticamente.
      </p>
    </div>
  );
}
