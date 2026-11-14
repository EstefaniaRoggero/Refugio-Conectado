import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  crearAviso,
  getAvisosPublicos,
  getAvisosAdmin,
  cambiarEstadoAviso,
  eliminarAviso,
} from '../controllers/perdidoController.js';
import { protect, authorize, optionalAuth } from '../middlewares/auth.js';
import { assertAdminRefugio } from '../middlewares/tenant.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

const limiteAvisos = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Enviaste demasiados avisos. Probá de nuevo en una hora.' },
});

router.get('/', getAvisosPublicos);
router.post('/', limiteAvisos, optionalAuth, upload.array('imagenes', 3), crearAviso);

router.get('/admin', protect, authorize('admin'), assertAdminRefugio, getAvisosAdmin);
router.patch('/admin/:id/estado', protect, authorize('admin'), assertAdminRefugio, cambiarEstadoAviso);
router.delete('/admin/:id', protect, authorize('admin'), assertAdminRefugio, eliminarAviso);

export default router;
