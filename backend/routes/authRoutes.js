import { Router } from 'express';
import { body } from 'express-validator';
import {
  register, login, googleLogin, getProfile, updateProfile, changePassword, forgotPassword, resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { crearLimitadorLogin, crearLimitadorRecuperacion } from '../middlewares/rateLimiters.js';

const router = Router();
const limitarLogin = crearLimitadorLogin();
const limitarRecuperacion = crearLimitadorRecuperacion();

router.post('/register', [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('apellido').trim().notEmpty().withMessage('El apellido es obligatorio'),
  body('email').isEmail().withMessage('Correo inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
], validate, register);

router.post('/login', limitarLogin, [
  body('email').isEmail().withMessage('Correo inválido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
], validate, login);

router.post('/google', [
  body('credential').notEmpty().withMessage('Token de Google requerido'),
], validate, googleLogin);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, [
  body('password_actual').notEmpty(),
  body('password_nueva').isLength({ min: 6 }),
], validate, changePassword);

router.post('/forgot-password', limitarRecuperacion, [body('email').isEmail()], validate, forgotPassword);
router.post('/reset-password', limitarRecuperacion, [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 }),
], validate, resetPassword);

export default router;
