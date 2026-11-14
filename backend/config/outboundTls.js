import https from 'https';
import { Agent, fetch as undiciFetch } from 'undici';

/**
 * En algunos entornos Windows (antivirus, proxy corporativo) Node no puede
 * verificar certificados TLS salientes hacia APIs externas (OpenAI, Google).
 *
 * Solo para desarrollo: DEV_TLS_INSECURE=true en backend/.env
 * NUNCA activar en producción.
 */
export function isDevTlsInsecure() {
  return process.env.NODE_ENV !== 'production' && process.env.DEV_TLS_INSECURE === 'true';
}

let undiciDispatcher = null;
let httpsAgent = null;

export function getHttpsAgent() {
  if (!isDevTlsInsecure()) return undefined;
  if (!httpsAgent) {
    httpsAgent = new https.Agent({ rejectUnauthorized: false });
  }
  return httpsAgent;
}

export function getOpenAIFetchOptions() {
  if (!isDevTlsInsecure()) return {};
  if (!undiciDispatcher) {
    undiciDispatcher = new Agent({ connect: { rejectUnauthorized: false } });
  }
  return {
    fetch: undiciFetch,
    fetchOptions: { dispatcher: undiciDispatcher },
  };
}

export function getGoogleClientOptions() {
  const agent = getHttpsAgent();
  if (!agent) return {};
  return { transporterOptions: { agent } };
}
