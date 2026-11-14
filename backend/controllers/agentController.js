import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';
import { chatWithAgent, isAIConfigured, getProviderInfo } from '../services/adoptionAgentService.js';
import { chatWithLuna, isAIConfigured as lunaConfigured } from '../services/lunaAssistantService.js';
import { buildWaMeLink, getPublicWhatsAppNumber, isWhatsAppConfigured, normalizeWhatsAppNumber } from '../services/whatsappService.js';
import { AGENT_KNOWLEDGE } from '../services/agentKnowledge.js';

export const getAgentStatus = asyncHandler(async (req, res) => {
  success(res, {
    disponible: isAIConfigured(),
    asistente: AGENT_KNOWLEDGE.asistente,
    nombre: AGENT_KNOWLEDGE.nombre,
    proveedor: getProviderInfo(),
  });
});

export const chatAgent = asyncHandler(async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || !messages.length) {
    return error(res, 'Se requiere un historial de mensajes', 400);
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser?.content?.trim()) {
    return error(res, 'El último mensaje del usuario no puede estar vacío', 400);
  }

  if (!isAIConfigured()) {
    return error(
      res,
      'El asistente no está configurado. Agrega GROQ_API_KEY (gratis en console.groq.com) en backend/.env y reinicia el servidor.',
      503
    );
  }

  try {
    const result = await chatWithAgent(messages, { idRefugio: req.refugioId });
    success(res, result);
  } catch (err) {
    if (err.code === 'AI_NOT_CONFIGURED') {
      return error(res, err.message, 503);
    }

    const cause = err.cause?.code || err.cause?.message || '';
    const msg = String(err.message || '');
    const status = err.status || err.response?.status;

    console.error('[agente/chat]', msg, cause || '');

    if (status === 429 || msg.includes('quota') || msg.includes('429')) {
      return error(
        res,
        'Luna está recibiendo muchas consultas en este momento. Esperá un minuto y volvé a escribirle 🐾',
        429
      );
    }

    if (status === 401 || msg.includes('Incorrect API key') || msg.includes('invalid_api_key')) {
      return error(res, 'Luna no está disponible en este momento. Probá de nuevo más tarde.', 503);
    }

    const isTls = cause.includes('UNABLE_TO_VERIFY') || msg.includes('certificate') || msg.includes('Connection error');
    if (isTls && process.env.NODE_ENV !== 'production') {
      return error(
        res,
        'Error SSL al conectar con OpenAI. Agrega DEV_TLS_INSECURE=true en backend/.env, reinicia el backend e intenta de nuevo.',
        502
      );
    }

    return error(res, 'Luna no pudo responder. Intentá de nuevo en unos segundos.', 502);
  }
});

export const getLunaWhatsAppConfig = asyncHandler(async (req, res) => {
  const rawPhone = getPublicWhatsAppNumber() || req.refugio?.telefono || '';
  const phone = normalizeWhatsAppNumber(rawPhone);
  const waLink = buildWaMeLink(phone, `Hola Luna, escribo desde ${req.refugio?.nombre || 'Refugio Conectado'}.`);

  success(res, {
    asistente: AGENT_KNOWLEDGE.asistente,
    disponible: lunaConfigured(),
    whatsappApi: isWhatsAppConfigured(),
    telefono: phone,
    waLink,
  });
});

export const chatLuna = asyncHandler(async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || !messages.length) {
    return error(res, 'Se requiere un historial de mensajes', 400);
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser?.content?.trim()) {
    return error(res, 'El último mensaje del usuario no puede estar vacío', 400);
  }

  if (!lunaConfigured()) {
    return error(
      res,
      'Luna no está configurada. Agrega GROQ_API_KEY en backend/.env y reinicia el servidor.',
      503
    );
  }

  try {
    const result = await chatWithLuna(messages, {
      idRefugio: req.refugioId,
      user: req.user,
      refugio: req.refugio,
    });
    success(res, result);
  } catch (err) {
    console.error('[agente/luna]', err.message);
    return error(res, 'Luna no pudo responder. Intentá de nuevo.', 502);
  }
});
