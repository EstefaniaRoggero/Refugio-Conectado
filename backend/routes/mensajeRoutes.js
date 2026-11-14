import { Router } from 'express';
import { body } from 'express-validator';
import { crearMensaje, getMensajes, marcarLeido, eliminarMensaje } from '../controllers/mensajeController.js';
import { protect, authorize, optionalAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { assertAdminRefugio } from '../middlewares/tenant.js';
import { auditMutations } from '../services/auditService.js';

const router = Router();

router.post('/', optionalAuth, [
  body('nombre').notEmpty(),
  body('email').isEmail(),
  body('asunto').notEmpty(),
  body('mensaje').notEmpty(),
], validate, crearMensaje);

router.get('/', protect, authorize('admin'), assertAdminRefugio, getMensajes);
router.patch('/:id/leido', protect, authorize('admin'), assertAdminRefugio, auditMutations, marcarLeido);
router.delete('/:id', protect, authorize('admin'), assertAdminRefugio, auditMutations, eliminarMensaje);

export default router;
