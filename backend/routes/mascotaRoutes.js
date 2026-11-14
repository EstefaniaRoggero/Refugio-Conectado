import { Router } from 'express';
import {
  getMascotas, getMascotaById, createMascota, updateMascota, deleteMascota, recomendarMascotas,
} from '../controllers/mascotaController.js';
import {
  getHistorialByMascota, crearRegistro, actualizarRegistro, eliminarRegistro,
} from '../controllers/historialMedicoController.js';
import { protect, authorize, optionalAuth } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { assertAdminRefugio } from '../middlewares/tenant.js';
import { auditMutations } from '../services/auditService.js';

const router = Router();

router.get('/', optionalAuth, getMascotas);
router.post('/recomendar', recomendarMascotas);
router.get('/:id/historial-medico', getHistorialByMascota);
router.post('/:id/historial-medico', protect, authorize('admin'), assertAdminRefugio, auditMutations, crearRegistro);
router.put('/historial-medico/:id', protect, authorize('admin'), assertAdminRefugio, auditMutations, actualizarRegistro);
router.delete('/historial-medico/:id', protect, authorize('admin'), assertAdminRefugio, auditMutations, eliminarRegistro);
router.get('/:id', optionalAuth, getMascotaById);
router.post('/', protect, authorize('admin'), assertAdminRefugio, upload.single('imagen'), auditMutations, createMascota);
router.put('/:id', protect, authorize('admin'), assertAdminRefugio, upload.single('imagen'), auditMutations, updateMascota);
router.delete('/:id', protect, authorize('admin'), assertAdminRefugio, auditMutations, deleteMascota);

export default router;
