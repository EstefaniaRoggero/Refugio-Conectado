import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import express from 'express';
import { firmaMetaValida, guardarCuerpoOriginal, textosIguales } from '../../middlewares/whatsappSecurity.js';
import whatsappRoutes from '../../routes/whatsappRoutes.js';

const SECRETO = 'secreto-de-prueba';
const firmar = (cuerpo, secreto = SECRETO) => `sha256=${crypto.createHmac('sha256', secreto).update(cuerpo).digest('hex')}`;

describe('firma de Meta', () => {
  const cuerpo = Buffer.from('{"entry":[]}');

  test('acepta la firma correcta', () => {
    assert.equal(firmaMetaValida(cuerpo, firmar(cuerpo), SECRETO), true);
  });

  test('rechaza cuerpo alterado, otra clave, prefijo incorrecto o firma ausente', () => {
    assert.equal(firmaMetaValida(Buffer.from('{"entry":[1]}'), firmar(cuerpo), SECRETO), false);
    assert.equal(firmaMetaValida(cuerpo, firmar(cuerpo, 'otra'), SECRETO), false);
    assert.equal(firmaMetaValida(cuerpo, firmar(cuerpo).replace('sha256=', 'sha1='), SECRETO), false);
    assert.equal(firmaMetaValida(cuerpo, 'sha256=corta', SECRETO), false);
    assert.equal(firmaMetaValida(cuerpo, undefined, SECRETO), false);
  });

  test('rechaza todo si no hay secreto configurado o no hay cuerpo original', () => {
    assert.equal(firmaMetaValida(cuerpo, firmar(cuerpo), undefined), false);
    assert.equal(firmaMetaValida(undefined, firmar(cuerpo), SECRETO), false);
  });

  test('textosIguales no acepta vacíos ni valores distintos', () => {
    assert.equal(textosIguales('abc', 'abc'), true);
    assert.equal(textosIguales('abc', 'abd'), false);
    assert.equal(textosIguales('', ''), false);
    assert.equal(textosIguales(undefined, undefined), false);
    assert.equal(textosIguales('abc', undefined), false);
  });
});

describe('rutas del webhook', () => {
  const VARIABLES = ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_APP_SECRET', 'WHATSAPP_VERIFY_TOKEN'];
  const originales = Object.fromEntries(VARIABLES.map((k) => [k, process.env[k]]));
  let servidor;
  let base;

  before(async () => {
    const app = express();
    app.use(express.json({ verify: guardarCuerpoOriginal }));
    app.use('/api/whatsapp', whatsappRoutes);
    servidor = app.listen(0);
    await new Promise((r) => servidor.once('listening', r));
    base = `http://127.0.0.1:${servidor.address().port}/api/whatsapp/webhook`;
  });

  after(() => {
    servidor.close();
    for (const k of VARIABLES) {
      if (originales[k] === undefined) delete process.env[k];
      else process.env[k] = originales[k];
    }
  });

  beforeEach(() => VARIABLES.forEach((k) => delete process.env[k]));

  const configurar = () => Object.assign(process.env, {
    WHATSAPP_TOKEN: 'token-prueba',
    WHATSAPP_PHONE_NUMBER_ID: '123',
    WHATSAPP_APP_SECRET: SECRETO,
    WHATSAPP_VERIFY_TOKEN: 'verificacion-larga-de-prueba',
  });

  const verificar = (token, challenge = 'reto-123') => fetch(`${base}?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(token)}&hub.challenge=${encodeURIComponent(challenge)}`);
  const enviar = (cuerpo, firma) => fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(firma ? { 'X-Hub-Signature-256': firma } : {}) },
    body: cuerpo,
  });

  test('sin WhatsApp configurado, verificación y mensajes responden 404', async () => {
    assert.equal((await verificar('refugio_luna')).status, 404);
    const cuerpo = '{"entry":[]}';
    assert.equal((await enviar(cuerpo, firmar(cuerpo))).status, 404);
  });

  test('el token por defecto viejo ya no sirve y sin token propio se rechaza', async () => {
    configurar();
    assert.equal((await verificar('refugio_luna')).status, 403);
    delete process.env.WHATSAPP_VERIFY_TOKEN;
    assert.equal((await verificar('refugio_luna')).status, 403);
  });

  test('con el token correcto devuelve el desafío como texto plano', async () => {
    configurar();
    const res = await verificar('verificacion-larga-de-prueba', '<script>x</script>');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /^text\/plain/);
    assert.equal(await res.text(), '<script>x</script>');
  });

  test('un mensaje sin firma o con firma inválida se rechaza con 403', async () => {
    configurar();
    const cuerpo = '{"entry":[]}';
    assert.equal((await enviar(cuerpo)).status, 403);
    assert.equal((await enviar(cuerpo, firmar(cuerpo, 'otra-clave'))).status, 403);
    assert.equal((await enviar('{"entry":[ ]}', firmar(cuerpo))).status, 403);
  });

  test('un mensaje con firma válida se acepta', async () => {
    configurar();
    const cuerpo = '{"entry":[]}';
    assert.equal((await enviar(cuerpo, firmar(cuerpo))).status, 200);
  });
});
