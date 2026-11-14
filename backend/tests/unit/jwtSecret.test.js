import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { asegurarJwtSecret, motivoJwtInseguro } from '../../config/jwtSecret.js';

test('rechaza un JWT_SECRET ausente', () => {
  for (const valor of [undefined, null, '', '   ']) {
    assert.equal(motivoJwtInseguro(valor), 'ausente');
    assert.throws(() => asegurarJwtSecret({ JWT_SECRET: valor }), /JWT_SECRET ausente/);
  }
});

test('rechaza un JWT_SECRET corto o de ejemplo', () => {
  for (const valor of ['corta', 'secret', 'cambia_este_secreto_por_uno_largo_y_seguro']) {
    assert.equal(motivoJwtInseguro(valor), 'inseguro');
    assert.throws(() => asegurarJwtSecret({ JWT_SECRET: valor }), /JWT_SECRET inseguro/);
  }
});

test('acepta un secreto aleatorio de 32 bytes', () => {
  const valor = crypto.randomBytes(32).toString('hex');
  assert.equal(motivoJwtInseguro(valor), null);
  assert.doesNotThrow(() => asegurarJwtSecret({ JWT_SECRET: valor }));
});
