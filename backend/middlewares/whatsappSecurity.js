import crypto from 'crypto';
import { isWhatsAppConfigured } from '../services/whatsappService.js';

export function textosIguales(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/** Meta firma cada POST con HMAC-SHA256 del cuerpo original usando el secreto de la app. */
export function firmaMetaValida(cuerpo, encabezado, secreto) {
  if (!Buffer.isBuffer(cuerpo) || !secreto || typeof encabezado !== 'string') return false;
  const esperada = `sha256=${crypto.createHmac('sha256', secreto).update(cuerpo).digest('hex')}`;
  return textosIguales(encabezado, esperada);
}

/** Opción `verify` de express.json: conserva los bytes originales que firma Meta. */
export function guardarCuerpoOriginal(req, _res, buf) {
  if (req.originalUrl.startsWith('/api/whatsapp')) req.rawBody = buf;
}

export function requireWhatsAppConfigured(req, res, next) {
  if (!isWhatsAppConfigured()) return res.sendStatus(404);
  next();
}

export function verifyWhatsAppSignature(req, res, next) {
  if (!firmaMetaValida(req.rawBody, req.get('x-hub-signature-256'), process.env.WHATSAPP_APP_SECRET)) {
    return res.sendStatus(403);
  }
  next();
}
