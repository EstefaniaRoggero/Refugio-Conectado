import './config/env.js';
import { asegurarJwtSecret } from './config/jwtSecret.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import mascotaRoutes from './routes/mascotaRoutes.js';
import adopcionRoutes from './routes/adopcionRoutes.js';
import donacionRoutes from './routes/donacionRoutes.js';
import voluntarioRoutes from './routes/voluntarioRoutes.js';
import favoritoRoutes from './routes/favoritoRoutes.js';
import mensajeRoutes from './routes/mensajeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import catalogoRoutes from './routes/catalogoRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import refugioRoutes from './routes/refugioRoutes.js';
import seguimientoRoutes from './routes/seguimientoRoutes.js';
import notificacionRoutes from './routes/notificacionRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import perdidoRoutes from './routes/perdidoRoutes.js';
import noticiaRoutes from './routes/noticiaRoutes.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { migrateSaas } from './config/migrateSaas.js';
import { migrateSeguimiento } from './config/migrateSeguimiento.js';
import { migrateVoluntarioCalendario } from './config/migrateVoluntarioCalendario.js';
import { migrateWhatsappLuna } from './config/migrateWhatsappLuna.js';
import { migrateBackoffice } from './config/migrateBackoffice.js';
import { migratePlatformBackoffice } from './config/migratePlatformBackoffice.js';
import { migratePerdidos } from './config/migratePerdidos.js';
import { migrateNoticias } from './config/migrateNoticias.js';
import { resolveTenant, requireTenant } from './middlewares/tenant.js';
import { guardarCuerpoOriginal } from './middlewares/whatsappSecurity.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb', verify: guardarCuerpoOriginal }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { success: false, message: 'Demasiadas solicitudes' } });
app.use('/api', limiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  etag: true,
}));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Refugio Conectado API funcionando', timestamp: new Date().toISOString() });
});

app.use('/api/whatsapp', whatsappRoutes);

app.use('/api/refugios', refugioRoutes);
app.use('/api/super-admin', superAdminRoutes);

app.use(resolveTenant);
app.use('/api', requireTenant);

app.use('/api/auth', authRoutes);
app.use('/api/mascotas', mascotaRoutes);
app.use('/api/adopciones', adopcionRoutes);
app.use('/api/donaciones', donacionRoutes);
app.use('/api/voluntarios', voluntarioRoutes);
app.use('/api/favoritos', favoritoRoutes);
app.use('/api/mensajes', mensajeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/catalogos', catalogoRoutes);
app.use('/api/agente', agentRoutes);
app.use('/api/seguimiento', seguimientoRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/perdidos', perdidoRoutes);
app.use('/api/noticias', noticiaRoutes);

app.use(notFound);
app.use(errorHandler);

async function runMigration(label, migration) {
  try {
    await migration();
  } catch (err) {
    console.error(`Migración ${label}:`, err.message);
  }
}

try {
  asegurarJwtSecret();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

// En Vercel el servidor tiene que escuchar enseguida: si las migraciones bloquean el arranque,
// cada instancia nueva tarda en responder y una falla deja la API caída. En producción se
// ejecutan a mano contra la base antes de desplegar.
app.listen(PORT, async () => {
  console.log(`🐾 Refugio Conectado API en http://localhost:${PORT}`);
  await runMigration('SaaS', migrateSaas);
  await runMigration('backoffice', migrateBackoffice);
  await runMigration('módulos globales', migratePlatformBackoffice);
  await runMigration('seguimiento', migrateSeguimiento);
  await runMigration('calendario voluntarios', migrateVoluntarioCalendario);
  await runMigration('Luna WhatsApp', migrateWhatsappLuna);
  await runMigration('perdidos y encontrados', migratePerdidos);
  await runMigration('novedades', migrateNoticias);
});
