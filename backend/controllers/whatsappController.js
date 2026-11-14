import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';
import {
  appendMessageAndReply,
  buildWaMeLink,
  getPublicWhatsAppNumber,
  isWhatsAppConfigured,
  sendWhatsAppText,
} from '../services/whatsappService.js';
import { textosIguales } from '../middlewares/whatsappSecurity.js';

export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && textosIguales(token, process.env.WHATSAPP_VERIFY_TOKEN)) {
    return res.status(200).type('text/plain').send(String(challenge ?? ''));
  }
  return res.sendStatus(403);
};

export const receiveWebhook = asyncHandler(async (req, res) => {
  res.sendStatus(200);

  const entry = req.body?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const message = value?.messages?.[0];

  if (!message || message.type !== 'text') return;

  const waId = message.from;
  const text = message.text?.body?.trim();
  if (!text) return;

  try {
    const reply = await appendMessageAndReply(waId, text);
    await sendWhatsAppText(waId, reply);
  } catch (err) {
    console.error('[whatsapp/webhook]', err.message);
    await sendWhatsAppText(
      waId,
      'Disculpá, Luna tuvo un problema técnico. Intentá de nuevo en unos minutos o contactá al refugio por la web.'
    );
  }
});
