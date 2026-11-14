import { Router } from 'express';
import { getDashboard, getUsuarios, updateUsuario, deleteUsuario } from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { assertAdminRefugio } from '../middlewares/tenant.js';
import { auditMutations } from '../services/auditService.js';

const router = Router();

router.use(protect, authorize('admin'), assertAdminRefugio, auditMutations);

router.get('/dashboard', getDashboard);
router.get('/usuarios', getUsuarios);
router.patch('/usuarios/:id', updateUsuario);
router.delete('/usuarios/:id', deleteUsuario);

export default router;
