import pool from '../config/database.js';
import { getRefugioBySlug } from '../utils/lookups.js';
import { chatWithLuna } from './lunaAssistantService.js';

export function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export function getPublicWhatsAppNumber() {
  return process.env.WHATSAPP_PUBLIC_NUMBER || process.env.WHATSAPP_DISPLAY_NUMBER || '';
}

export async function sendWhatsAppText(toWaId, text) {
  if (!isWhatsAppConfigured()) {
    console.warn('[whatsapp] No configurado — mensaje no enviado');
    return false;
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toWaId,
      type: 'text',
      text: { body: text.slice(0, 4096) },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[whatsapp] Error enviando:', err);
    return false;
  }
  return true;
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

export function normalizeWhatsAppNumber(phone) {
  let n = normalizePhone(phone);
  if (!n) return '';
  // Celulares argentinos en wa.me: 54 + 9 + código de área + número (10 dígitos locales)
  if (n.length === 10) n = `549${n}`;
  else if (n.length <= 11 && !n.startsWith('54')) n = `54${n}`;
  return n;
}

async function findUserByPhone(waId) {
  const digits = normalizePhone(waId);
  if (!digits) return null;
  const tail = digits.slice(-10);
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.apellido, u.telefono, ro.nombre_rol AS rol, u.id_refugio
     FROM usuarios u
     JOIN roles ro ON u.id_rol = ro.id_rol
     WHERE REPLACE(REPLACE(REPLACE(u.telefono, ' ', ''), '-', ''), '+', '') LIKE ?
     LIMIT 1`,
    [`%${tail}`]
  );
  return rows[0] || null;
}

async function getDefaultRefugio() {
  const slug = process.env.WHATSAPP_DEFAULT_REFUGIO_SLUG || 'villa-del-rosario';
  return getRefugioBySlug(slug);
}

export async function getOrCreateSession(waId) {
  const [existing] = await pool.query(
    'SELECT * FROM luna_whatsapp_sesiones WHERE wa_id = ?',
    [waId]
  );
  if (existing.length) return existing[0];

  const user = await findUserByPhone(waId);
  const refugio = await getDefaultRefugio();

  const [result] = await pool.query(
    `INSERT INTO luna_whatsapp_sesiones (wa_id, id_usuario, id_refugio, mensajes)
     VALUES (?, ?, ?, '[]')`,
    [waId, user?.id || null, refugio?.id_refugio || null]
  );

  const [row] = await pool.query('SELECT * FROM luna_whatsapp_sesiones WHERE id = ?', [result.insertId]);
  return row[0];
}

export async function appendMessageAndReply(waId, userText) {
  const session = await getOrCreateSession(waId);
  let mensajes = [];
  try {
    mensajes = JSON.parse(session.mensajes || '[]');
  } catch {
    mensajes = [];
  }

  mensajes.push({ role: 'user', content: userText });
  mensajes = mensajes.slice(-12);

  let user = null;
  if (session.id_usuario) {
    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, ro.nombre_rol AS rol FROM usuarios u
       JOIN roles ro ON u.id_rol = ro.id_rol WHERE u.id = ?`,
      [session.id_usuario]
    );
    user = rows[0] || null;
  } else {
    user = await findUserByPhone(waId);
    if (user) {
      await pool.query('UPDATE luna_whatsapp_sesiones SET id_usuario = ? WHERE id = ?', [user.id, session.id]);
    }
  }

  const refugio = session.id_refugio
    ? (await pool.query('SELECT * FROM refugios WHERE id_refugio = ?', [session.id_refugio]))[0][0]
    : await getDefaultRefugio();

  const result = await chatWithLuna(mensajes, {
    idRefugio: refugio?.id_refugio,
    user,
    refugio,
  });

  mensajes.push({ role: 'assistant', content: result.mensaje });
  mensajes = mensajes.slice(-12);

  await pool.query('UPDATE luna_whatsapp_sesiones SET mensajes = ? WHERE id = ?', [
    JSON.stringify(mensajes),
    session.id,
  ]);

  return result.mensaje;
}

export function buildWaMeLink(number, text) {
  const n = normalizeWhatsAppNumber(number);
  if (!n) return null;
  const msg = encodeURIComponent(text || 'Hola Luna, tengo una consulta sobre el refugio.');
  return `https://wa.me/${n}?text=${msg}`;
}
