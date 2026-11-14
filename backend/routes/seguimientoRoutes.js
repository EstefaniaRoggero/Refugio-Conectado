import { Router } from 'express';
import {
  getMisSeguimientos,
  getSeguimientoDetalle,
  actualizarFrecuencia,
  crearReporte,
  getAdminLista,
  getAdminDetalle,
  revisarReporte,
} from '../controllers/seguimientoController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { assertAdminRefugio } from '../middlewares/tenant.js';
import { upload } from '../middlewares/upload.js';
import { auditMutations } from '../services/auditService.js';

const router = Router();

router.get('/admin/lista', protect, authorize('admin'), assertAdminRefugio, getAdminLista);
router.get('/admin/:id', protect, authorize('admin'), assertAdminRefugio, getAdminDetalle);
router.patch('/admin/reportes/:idReporte', protect, authorize('admin'), assertAdminRefugio, auditMutations, revisarReporte);

router.get('/mis', protect, authorize('usuario', 'voluntario'), getMisSeguimientos);
router.get('/:id', protect, authorize('usuario', 'voluntario'), getSeguimientoDetalle);
router.patch('/:id/frecuencia', protect, authorize('usuario', 'voluntario'), actualizarFrecuencia);
router.post(
  '/:id/reportes',
  protect,
  authorize('usuario', 'voluntario'),
  upload.array('imagenes', 5),
  crearReporte
);

export default router;
