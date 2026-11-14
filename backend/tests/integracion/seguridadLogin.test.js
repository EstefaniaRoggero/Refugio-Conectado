/**
 * Integración contra una base MySQL/MariaDB LOCAL y descartable.
 * Se saltea salvo que TEST_DB_NAME termine en "_test" y TEST_DB_HOST sea localhost/127.0.0.1.
 * La base se crea desde database/schema.sql y se borra al terminar (TEST_DB_CONSERVAR=true la deja).
 *
 *   $env:TEST_DB_HOST="127.0.0.1"; $env:TEST_DB_USER="root"; $env:TEST_DB_NAME="refugio_seguridad_test"; npm test
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const host = process.env.TEST_DB_HOST || '';
const nombreBase = process.env.TEST_DB_NAME || '';
const habilitada = /_test$/.test(nombreBase) && ['localhost', '127.0.0.1'].includes(host);
const SLUG = 'villa-del-rosario';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('seguridad de login contra base local de prueba', { skip: !habilitada && 'definí TEST_DB_HOST local y TEST_DB_NAME terminado en _test' }, () => {
  const claves = {};
  let mysql;
  let bcrypt;
  let pool;
  let servidor;
  let base;
  let payloadGoogle;
  let ipSiguiente = 1;

  const nuevaIp = () => `10.0.0.${ipSiguiente++}`;
  const pedir = (ruta, cuerpo, { ip = nuevaIp(), tenant = true } = {}) => fetch(`${base}${ruta}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': ip,
      ...(tenant ? { 'X-Refugio-Slug': SLUG } : {}),
    },
    body: JSON.stringify(cuerpo),
  });
  const loginAdmin = (email, password, ip) => pedir('/api/auth/login', { email, password }, { ip });
  const loginSuper = (email, password, ip) => pedir('/api/super-admin/login', { email, password }, { ip, tenant: false });

  before(async () => {
    Object.assign(process.env, {
      DB_HOST: host,
      DB_PORT: process.env.TEST_DB_PORT || '3306',
      DB_USER: process.env.TEST_DB_USER || 'root',
      DB_PASSWORD: process.env.TEST_DB_PASSWORD || '',
      DB_NAME: nombreBase,
      JWT_SECRET: crypto.randomBytes(32).toString('hex'),
      GOOGLE_CLIENT_ID: 'cliente-de-prueba.apps.googleusercontent.com',
      NODE_ENV: 'test',
    });
    delete process.env.DEV_EXPONER_TOKEN_RESET;

    mysql = (await import('mysql2/promise')).default;
    bcrypt = (await import('bcryptjs')).default;

    const admin = await mysql.createConnection({
      host, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASSWORD, multipleStatements: true,
    });
    await admin.query(`DROP DATABASE IF EXISTS \`${nombreBase}\``);
    await admin.query(`CREATE DATABASE \`${nombreBase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await admin.query(`USE \`${nombreBase}\``);
    const esquema = fs.readFileSync(path.join(raiz, 'database', 'schema.sql'), 'utf8')
      .split('\n')
      .filter((linea) => !/^\s*(CREATE DATABASE|USE)\b/i.test(linea))
      .join('\n');
    await admin.query(esquema);
    await admin.query("INSERT IGNORE INTO roles (nombre_rol, descripcion) VALUES ('voluntario', 'Voluntario')");

    const [[refugio]] = await admin.query('SELECT id_refugio FROM refugios WHERE slug = ?', [SLUG]);
    const [roles] = await admin.query('SELECT id_rol, nombre_rol FROM roles');
    const rol = Object.fromEntries(roles.map((r) => [r.nombre_rol, r.id_rol]));
    const crear = async (email, nombreRol, { conClave = true, googleId = null } = {}) => {
      claves[email] = crypto.randomBytes(12).toString('base64url');
      await admin.query(
        `INSERT INTO usuarios (nombre, apellido, email, password, google_id, auth_provider, id_rol, id_refugio)
         VALUES ('Prueba', 'Seguridad', ?, ?, ?, ?, ?, ?)`,
        [email, conClave ? await bcrypt.hash(claves[email], 4) : null, googleId, conClave ? 'local' : 'google', rol[nombreRol], nombreRol === 'admin' ? refugio.id_refugio : null]
      );
    };
    for (const n of [1, 2, 3, 4]) await crear(`admin${n}@prueba.test`, 'admin');
    await crear('super@prueba.test', 'super_admin');
    await crear('super-google@prueba.test', 'super_admin', { googleId: 'google-super-1' });
    await crear('adoptante@prueba.test', 'usuario', { conClave: false, googleId: 'google-adoptante-1' });
    await admin.end();

    const { OAuth2Client } = await import('google-auth-library');
    OAuth2Client.prototype.verifyIdToken = async () => ({ getPayload: () => payloadGoogle });

    const express = (await import('express')).default;
    const { default: authRoutes } = await import('../../routes/authRoutes.js');
    const { default: superAdminRoutes } = await import('../../routes/superAdminRoutes.js');
    const { resolveTenant, requireTenant } = await import('../../middlewares/tenant.js');
    const { errorHandler } = await import('../../middlewares/errorHandler.js');
    pool = (await import('../../config/database.js')).default;

    const app = express();
    app.set('trust proxy', 1);
    app.use(express.json());
    app.use('/api/super-admin', superAdminRoutes);
    app.use(resolveTenant);
    app.use('/api', requireTenant);
    app.use('/api/auth', authRoutes);
    app.use(errorHandler);
    servidor = app.listen(0);
    await new Promise((r) => servidor.once('listening', r));
    base = `http://127.0.0.1:${servidor.address().port}`;
  });

  after(async () => {
    servidor?.close();
    await pool?.end();
    if (habilitada && process.env.TEST_DB_CONSERVAR !== 'true') {
      const admin = await mysql.createConnection({ host, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASSWORD });
      await admin.query(`DROP DATABASE IF EXISTS \`${nombreBase}\``);
      await admin.end();
    }
  });

  test('admin: inicia sesión con la contraseña correcta', async () => {
    const res = await loginAdmin('admin1@prueba.test', claves['admin1@prueba.test']);
    assert.equal(res.status, 200);
    assert.ok((await res.json()).data.token);
  });

  test('admin: tras 5 fallos se bloquea 15 minutos, aunque después use la contraseña correcta', async () => {
    const email = 'admin2@prueba.test';
    for (let i = 0; i < 5; i += 1) assert.equal((await loginAdmin(email, 'incorrecta')).status, 401);
    const bloqueado = await loginAdmin(email, claves[email]);
    assert.equal(bloqueado.status, 429);
    assert.match((await bloqueado.json()).message, /15 minutos/);

    const [filas] = await pool.query("SELECT entidad_id, datos FROM registros_actividad WHERE accion = 'LOGIN_FALLIDO'");
    assert.ok(filas.length >= 5);
    assert.equal(JSON.stringify(filas).includes(email), false, 'no debe guardar el correo en claro');
  });

  test('admin: cuando pasan los 15 minutos vuelve a poder entrar', async () => {
    const email = 'admin2@prueba.test';
    const { claveDeEmail } = await import('../../utils/authSecurity.js');
    await pool.query(
      "UPDATE registros_actividad SET created_at = NOW() - INTERVAL 16 MINUTE WHERE accion = 'LOGIN_FALLIDO' AND entidad_id = ?",
      [claveDeEmail(email)]
    );
    assert.equal((await loginAdmin(email, claves[email])).status, 200);
  });

  test('admin: un inicio de sesión exitoso descuenta los fallos anteriores, pero no los posteriores', async () => {
    const email = 'admin3@prueba.test';
    for (let i = 0; i < 4; i += 1) assert.equal((await loginAdmin(email, 'incorrecta')).status, 401);
    assert.equal((await loginAdmin(email, claves[email])).status, 200);
    for (let i = 0; i < 4; i += 1) assert.equal((await loginAdmin(email, 'incorrecta')).status, 401);
    assert.equal((await loginAdmin(email, claves[email])).status, 200);
    for (let i = 0; i < 5; i += 1) assert.equal((await loginAdmin(email, 'incorrecta')).status, 401);
    assert.equal((await loginAdmin(email, claves[email])).status, 429);
  });

  test('un correo inexistente se comporta igual que uno real (no revela cuentas)', async () => {
    const email = 'no-existe@prueba.test';
    for (let i = 0; i < 5; i += 1) {
      const res = await loginAdmin(email, 'incorrecta');
      assert.equal(res.status, 401);
      assert.equal((await res.json()).message, 'Credenciales incorrectas');
    }
    assert.equal((await loginAdmin(email, 'incorrecta')).status, 429);
  });

  test('superadmin: inicia sesión y se bloquea tras 5 fallos', async () => {
    const email = 'super@prueba.test';
    assert.equal((await loginSuper(email, claves[email])).status, 200);
    for (let i = 0; i < 5; i += 1) assert.equal((await loginSuper(email, 'incorrecta')).status, 401);
    assert.equal((await loginSuper(email, claves[email])).status, 429);
  });

  test('límite por IP: la misma conexión no puede seguir probando correos distintos', async () => {
    const ip = nuevaIp();
    for (let i = 0; i < 10; i += 1) {
      assert.equal((await loginAdmin(`ip-${i}@prueba.test`, 'incorrecta', ip)).status, 401);
    }
    const res = await loginAdmin('admin4@prueba.test', claves['admin4@prueba.test'], ip);
    assert.equal(res.status, 429);
    assert.match((await res.json()).message, /esta conexión/);
    assert.equal((await loginAdmin('admin4@prueba.test', claves['admin4@prueba.test'])).status, 200);
  });

  test('recuperación: nunca devuelve el token fuera de desarrollo con permiso explícito', async () => {
    const email = 'admin1@prueba.test';
    const pedirToken = async () => (await (await pedir('/api/auth/forgot-password', { email })).json()).data?.resetToken;

    process.env.NODE_ENV = 'production';
    process.env.DEV_EXPONER_TOKEN_RESET = 'true';
    assert.equal(await pedirToken(), undefined);

    process.env.NODE_ENV = 'development';
    delete process.env.DEV_EXPONER_TOKEN_RESET;
    assert.equal(await pedirToken(), undefined);

    process.env.DEV_EXPONER_TOKEN_RESET = 'true';
    assert.match(await pedirToken(), /^[0-9a-f]{64}$/);

    process.env.NODE_ENV = 'test';
    delete process.env.DEV_EXPONER_TOKEN_RESET;
  });

  test('recuperación: se limita la cantidad de solicitudes por conexión', async () => {
    const ip = nuevaIp();
    for (let i = 0; i < 10; i += 1) {
      assert.equal((await pedir('/api/auth/forgot-password', { email: 'admin1@prueba.test' }, { ip })).status, 200);
    }
    assert.equal((await pedir('/api/auth/forgot-password', { email: 'admin1@prueba.test' }, { ip })).status, 429);
  });

  describe('login con Google', () => {
    const google = (payload) => {
      payloadGoogle = payload;
      return pedir('/api/auth/google', { credential: 'token-simulado' });
    };

    test('rechaza un correo de Google no verificado', async () => {
      const res = await google({ sub: 'g-1', email: 'nuevo@prueba.test', email_verified: false });
      assert.equal(res.status, 403);
    });

    test('rechaza a un superadmin por correo', async () => {
      assert.equal((await google({ sub: 'g-2', email: 'super@prueba.test', email_verified: true })).status, 403);
    });

    test('rechaza a un superadmin ya vinculado por su cuenta de Google', async () => {
      assert.equal((await google({ sub: 'google-super-1', email: 'otro-correo@prueba.test', email_verified: true })).status, 403);
    });

    test('rechaza a un administrador', async () => {
      assert.equal((await google({ sub: 'g-3', email: 'admin1@prueba.test', email_verified: true })).status, 403);
    });

    test('un adoptante existente entra normalmente', async () => {
      const res = await google({ sub: 'google-adoptante-1', email: 'adoptante@prueba.test', email_verified: true });
      assert.equal(res.status, 200);
      assert.equal((await res.json()).data.user.rol, 'usuario');
    });

    test('una persona nueva se registra como adoptante', async () => {
      const res = await google({ sub: 'g-nuevo', email: 'nueva-persona@prueba.test', email_verified: true, given_name: 'Nueva' });
      assert.equal(res.status, 200);
      assert.equal((await res.json()).data.user.rol, 'usuario');
    });
  });
});
