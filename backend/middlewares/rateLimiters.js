import rateLimit from 'express-rate-limit';

const QUINCE_MINUTOS = 15 * 60 * 1000;

/** Primera barrera por IP. En Vercel cada instancia lleva su cuenta; el bloqueo por cuenta vive en la base. */
export function crearLimitadorLogin({ limit = 10, windowMs = QUINCE_MINUTOS } = {}) {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Demasiados intentos desde esta conexión. Esperá 15 minutos e intentá de nuevo.' },
  });
}

export function crearLimitadorRecuperacion({ limit = 10, windowMs = QUINCE_MINUTOS } = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Demasiadas solicitudes. Esperá 15 minutos e intentá de nuevo.' },
  });
}
