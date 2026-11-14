import { Router } from 'express';
import { body } from 'express-validator';
import {
  crearSolicitud, getMisSolicitudes, getAllSolicitudes, actualizarEstado,
} from '../controllers/adopcionController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { assertAdminRefugio } from '../middlewares/tenant.js';
import { auditMutations } from '../services/auditService.js';

const router = Router();

router.post('/', protect, [
  body('mascota_id').isInt().withMessage('Mascota inválida'),
  body('motivo_adopcion').notEmpty().withMessage('El motivo es obligatorio'),
], validate, crearSolicitud);

router.get('/mis-solicitudes', protect, getMisSolicitudes);
router.get('/', protect, authorize('admin'), assertAdminRefugio, getAllSolicitudes);
router.patch('/:id/estado', protect, authorize('admin'), assertAdminRefugio, auditMutations, actualizarEstado);

export default router;
