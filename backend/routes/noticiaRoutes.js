import { Router } from 'express';
import {
  getNoticiasPublicas,
  getNoticiasAdmin,
  crearNoticia,
  actualizarNoticia,
  eliminarNoticia,
} from '../controllers/noticiaController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { assertAdminRefugio } from '../middlewares/tenant.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

router.get('/', getNoticiasPublicas);

router.get('/admin', protect, authorize('admin'), assertAdminRefugio, getNoticiasAdmin);
router.post('/admin', protect, authorize('admin'), assertAdminRefugio, upload.single('imagen'), crearNoticia);
router.put('/admin/:id', protect, authorize('admin'), assertAdminRefugio, upload.single('imagen'), actualizarNoticia);
router.delete('/admin/:id', protect, authorize('admin'), assertAdminRefugio, eliminarNoticia);

export default router;
