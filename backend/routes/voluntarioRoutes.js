import { Router } from 'express';
import {
  registrarVoluntario, getMiVoluntariado, getAllVoluntarios, actualizarEstadoVoluntario,
  getCalendarioVoluntarios, getMisTurnosVoluntario, crearTurnoVoluntario, eliminarTurnoVoluntario,
} from '../controllers/voluntarioController.js';
import { protect, authorize, optionalAuth } from '../middlewares/auth.js';
import { assertAdminRefugio } from '../middlewares/tenant.js';
import { auditMutations } from '../services/auditService.js';

const router = Router();

router.get('/calendario', optionalAuth, assertAdminRefugio, getCalendarioVoluntarios);
router.get('/turnos/mios', protect, getMisTurnosVoluntario);
router.post('/turnos', protect, assertAdminRefugio, auditMutations, crearTurnoVoluntario);
router.delete('/turnos/:id', protect, assertAdminRefugio, auditMutations, eliminarTurnoVoluntario);

router.post('/', protect, registrarVoluntario);
router.get('/mi-solicitud', protect, getMiVoluntariado);
router.get('/', protect, authorize('admin'), assertAdminRefugio, getAllVoluntarios);
router.patch('/:id/estado', protect, authorize('admin'), assertAdminRefugio, auditMutations, actualizarEstadoVoluntario);

export default router;
