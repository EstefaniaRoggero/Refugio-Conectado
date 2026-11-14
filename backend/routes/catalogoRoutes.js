import { Router } from 'express';
import { getRazas, getTiposMascota } from '../controllers/catalogoController.js';

const router = Router();

router.get('/razas', getRazas);
router.get('/tipos-mascota', getTiposMascota);

export default router;
