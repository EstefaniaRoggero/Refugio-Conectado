import { Router } from 'express';
import { body } from 'express-validator';
import {
  crearDonacion, getMisDonaciones, getAllDonaciones, getDonacionesPublicas,
} from '../controllers/donacionController.js';
import { protect, authorize, optionalAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { assertAdminRefugio } from '../middlewares/tenant.js';

const router = Router();

router.get('/publicas', getDonacionesPublicas);
router.post('/', optionalAuth, [
  body('monto').isFloat({ min: 1 }).withMessage('Monto inválido'),
  body('metodo_pago').isIn(['mercadopago', 'tarjeta', 'transferencia']),
], validate, crearDonacion);

router.get('/mis-donaciones', protect, getMisDonaciones);
router.get('/', protect, authorize('admin'), assertAdminRefugio, getAllDonaciones);

export default router;
