import { Router } from 'express';
import { getFavoritos, toggleFavorito } from '../controllers/favoritoController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

router.get('/', protect, getFavoritos);
router.post('/toggle', protect, toggleFavorito);

export default router;
