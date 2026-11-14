/** Evita llamar google.accounts.id.initialize() más de una vez (aviso GSI_LOGGER en dev). */
let initializedForClient = null;

const pendingCallbacks = new Set();

function dispatchCredential(response) {
  if (!response?.credential) return;
  pendingCallbacks.forEach((cb) => {
    try {
      cb(response);
    } catch {
      /* handler del componente */
    }
  });
}

export function registerGoogleCredentialHandler(handler) {
  pendingCallbacks.add(handler);
  return () => pendingCallbacks.delete(handler);
}

export function ensureGoogleIdInitialized(clientId) {
  if (!clientId || !window.google?.accounts?.id) return false;

  if (initializedForClient === clientId) return true;

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: dispatchCredential,
  });

  initializedForClient = clientId;
  return true;
}

export function renderGoogleSignInButton(container, options) {
  if (!container || !window.google?.accounts?.id) return;
  container.innerHTML = '';
  window.google.accounts.id.renderButton(container, options);
}
