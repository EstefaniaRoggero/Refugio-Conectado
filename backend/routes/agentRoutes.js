import { Router } from 'express';
import { chatAgent, chatLuna, getAgentStatus, getLunaWhatsAppConfig } from '../controllers/agentController.js';
import { optionalAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/status', getAgentStatus);
router.get('/luna/config', getLunaWhatsAppConfig);
router.post('/chat', chatAgent);
router.post('/luna', optionalAuth, chatLuna);

export default router;
