import OpenAI from 'openai';
import { getOpenAIFetchOptions } from './outboundTls.js';

const PROVIDERS = {
  groq: {
    label: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    apiKeyEnv: 'GROQ_API_KEY',
    defaultModel: 'openai/gpt-oss-120b',
    gratis: true,
  },
  openai: {
    label: 'OpenAI',
    baseURL: undefined,
    apiKeyEnv: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o-mini',
    gratis: false,
  },
};

export function resolveProvider() {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit && PROVIDERS[explicit] && process.env[PROVIDERS[explicit].apiKeyEnv]) {
    return explicit;
  }
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return null;
}

export function isAIConfigured() {
  return resolveProvider() !== null;
}

export function getProviderInfo() {
  const id = resolveProvider();
  if (!id) return null;
  const cfg = PROVIDERS[id];
  return {
    id,
    label: cfg.label,
    model: getAIModel(),
    gratis: cfg.gratis,
  };
}

export function getAIModel() {
  const id = resolveProvider();
  if (!id) return null;
  return process.env.AI_MODEL || process.env.OPENAI_MODEL || PROVIDERS[id].defaultModel;
}

let client = null;
let clientProvider = null;

export function getAIClient() {
  const provider = resolveProvider();
  if (!provider) {
    const err = new Error(
      'Ningún proveedor de IA configurado. Agrega GROQ_API_KEY (gratis en console.groq.com) en backend/.env'
    );
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  if (client && clientProvider === provider) return client;

  const cfg = PROVIDERS[provider];
  client = new OpenAI({
    apiKey: process.env[cfg.apiKeyEnv],
    baseURL: cfg.baseURL,
    ...getOpenAIFetchOptions(),
  });
  clientProvider = provider;
  return client;
}
