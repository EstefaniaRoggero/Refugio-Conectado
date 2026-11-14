import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import pool from '../../config/database.js';
import { crearControlIntentos } from '../../services/loginAttemptService.js';
import { crearLimitadorLogin, crearLimitadorRecuperacion } from '../../middlewares/rateLimiters.js';
import { claveDeEmail } from '../../utils/authSecurity.js';

after(() => pool.end());

function baseFalsa(fallos = 0, { fallar = false } = {}) {
  const consultas = [];
  return {
    consultas,
    async query(sql, params) {
      consultas.push({ sql, params });
      if (fallar) throw new Error('base caída');
      if (sql.includes('SELECT COUNT(*)')) return [[{ fallos }]];
      return [{ affectedRows: 1 }];
    },
  };
}

describe('bloqueo por cuenta', () => {
  test('bloquea a partir del quinto fallo dentro de la ventana', async () => {
    assert.equal(await crearControlIntentos(baseFalsa(4)).estaBloqueado('a@b.test'), false);
    assert.equal(await crearControlIntentos(baseFalsa(5)).estaBloqueado('a@b.test'), true);
    assert.equal(await crearControlIntentos(baseFalsa(9)).estaBloqueado('a@b.test'), true);
  });

  test('consulta por la clave del correo, con ventana de 15 minutos y descontando éxitos', async () => {
    const db = baseFalsa(0);
    await crearControlIntentos(db).estaBloqueado('Admin@B.test');
    const { sql, params } = db.consultas[0];
    assert.match(sql, /INTERVAL \? MINUTE/);
    assert.match(sql, /MAX\(id\)/);
    assert.deepEqual(params, ['LOGIN_FALLIDO', claveDeEmail('admin@b.test'), 15, ['LOGIN_ADMIN', 'LOGIN_SUPER_ADMIN'], claveDeEmail('admin@b.test')]);
  });

  test('registra el fallo sin guardar el correo en claro', async () => {
    const db = baseFalsa();
    await crearControlIntentos(db).registrarFallo('admin@b.test', { tipo: 'admin', ip: '1.2.3.4', userAgent: 'prueba' });
    const { sql, params } = db.consultas[0];
    assert.match(sql, /INSERT INTO registros_actividad/);
    assert.equal(params[0], 'LOGIN_FALLIDO');
    assert.equal(params[1], claveDeEmail('admin@b.test'));
    assert.equal(JSON.stringify(params).includes('admin@b.test'), false);
  });

  test('si la base falla no bloquea ni rompe el login', async () => {
    const control = crearControlIntentos(baseFalsa(0, { fallar: true }));
    const errorOriginal = console.error;
    console.error = () => {};
    try {
      assert.equal(await control.estaBloqueado('a@b.test'), false);
      await control.registrarFallo('a@b.test', { tipo: 'admin' });
    } finally {
      console.error = errorOriginal;
    }
  });
});

describe('límite por IP', () => {
  async function levantar(limitador) {
    const app = express();
    app.use(express.json());
    app.post('/login', limitador, (req, res) => res.status(req.body.ok ? 200 : 401).json({}));
    const servidor = app.listen(0);
    await new Promise((r) => servidor.once('listening', r));
    const url = `http://127.0.0.1:${servidor.address().port}/login`;
    const pedir = (ok) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok }) });
    return { servidor, pedir };
  }

  test('login: tras el límite de fallos responde 429, aunque la contraseña sea correcta', async () => {
    const { servidor, pedir } = await levantar(crearLimitadorLogin({ limit: 3 }));
    try {
      for (let i = 0; i < 3; i += 1) assert.equal((await pedir(false)).status, 401);
      const bloqueado = await pedir(true);
      assert.equal(bloqueado.status, 429);
      assert.match((await bloqueado.json()).message, /Demasiados intentos/);
    } finally {
      servidor.close();
    }
  });

  test('login: los inicios de sesión exitosos no consumen el límite', async () => {
    const { servidor, pedir } = await levantar(crearLimitadorLogin({ limit: 2 }));
    try {
      for (let i = 0; i < 5; i += 1) assert.equal((await pedir(true)).status, 200);
      assert.equal((await pedir(false)).status, 401);
    } finally {
      servidor.close();
    }
  });

  test('recuperación: cuenta todas las solicitudes', async () => {
    const { servidor, pedir } = await levantar(crearLimitadorRecuperacion({ limit: 2 }));
    try {
      assert.equal((await pedir(true)).status, 200);
      assert.equal((await pedir(true)).status, 200);
      assert.equal((await pedir(true)).status, 429);
    } finally {
      servidor.close();
    }
  });
});
