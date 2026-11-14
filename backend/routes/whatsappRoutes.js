import { Router } from 'express';
import { verifyWebhook, receiveWebhook } from '../controllers/whatsappController.js';
import { requireWhatsAppConfigured, verifyWhatsAppSignature } from '../middlewares/whatsappSecurity.js';

const router = Router();

router.get('/webhook', requireWhatsAppConfigured, verifyWebhook);
router.post('/webhook', requireWhatsAppConfigured, verifyWhatsAppSignature, receiveWebhook);

export default router;
