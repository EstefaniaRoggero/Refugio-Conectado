import { Router } from 'express';
import { getMisNotificaciones, marcarLeida } from '../controllers/notificacionController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

router.get('/', protect, getMisNotificaciones);
router.patch('/:id/leida', protect, marcarLeida);

export default router;
