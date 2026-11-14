import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  claveDeEmail, compararSinCuenta, correoGoogleVerificado, exponerTokenReset, rolPermiteGoogle,
} from '../../utils/authSecurity.js';

test('solo adoptantes y voluntarios pueden entrar con Google', () => {
  assert.equal(rolPermiteGoogle('usuario'), true);
  assert.equal(rolPermiteGoogle('voluntario'), true);
  assert.equal(rolPermiteGoogle('admin'), false);
  assert.equal(rolPermiteGoogle('super_admin'), false);
  assert.equal(rolPermiteGoogle(undefined), false);
});

test('el correo de Google tiene que estar verificado', () => {
  assert.equal(correoGoogleVerificado({ email_verified: true }), true);
  assert.equal(correoGoogleVerificado({ email_verified: 'true' }), true);
  assert.equal(correoGoogleVerificado({ email_verified: false }), false);
  assert.equal(correoGoogleVerificado({}), false);
  assert.equal(correoGoogleVerificado(null), false);
});

test('la clave del correo es estable, normalizada y no contiene el correo', () => {
  const clave = claveDeEmail('  Admin@Refugio.Test ');
  assert.equal(clave, claveDeEmail('admin@refugio.test'));
  assert.match(clave, /^[0-9a-f]{64}$/);
  assert.equal(clave.includes('admin'), false);
  assert.notEqual(clave, claveDeEmail('otro@refugio.test'));
});

test('el token de recuperación solo se expone en desarrollo con permiso explícito', () => {
  assert.equal(exponerTokenReset({ NODE_ENV: 'development', DEV_EXPONER_TOKEN_RESET: 'true' }), true);
  assert.equal(exponerTokenReset({ NODE_ENV: 'development' }), false);
  assert.equal(exponerTokenReset({ NODE_ENV: 'production', DEV_EXPONER_TOKEN_RESET: 'true' }), false);
  assert.equal(exponerTokenReset({ DEV_EXPONER_TOKEN_RESET: 'true' }), false);
  assert.equal(exponerTokenReset({}), false);
});

test('la comparación sin cuenta siempre falla', async () => {
  assert.equal(await compararSinCuenta('cualquier-cosa'), false);
  assert.equal(await compararSinCuenta(undefined), false);
});
