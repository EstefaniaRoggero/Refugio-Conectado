import { Router } from 'express';
import { listRefugios, getRefugioBySlugHandler } from '../controllers/refugioController.js';

const router = Router();

router.get('/', listRefugios);
router.get('/:slug', getRefugioBySlugHandler);

export default router;
