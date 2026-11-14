const LONGITUD_MINIMA = 32;

const EJEMPLOS_INSEGUROS = new Set([
  'secret',
  'jwt_secret',
  'changeme',
  'change_me',
  'cambia_este_secreto_por_uno_largo_y_seguro',
  'tu_secreto',
  'password',
  'supersecret',
  'your-secret-key',
  'your_secret_key',
  'development',
  'dev-secret',
]);

export function motivoJwtInseguro(valor) {
  const secreto = typeof valor === 'string' ? valor.trim() : '';
  if (!secreto) return 'ausente';
  if (secreto.length < LONGITUD_MINIMA || EJEMPLOS_INSEGUROS.has(secreto.toLowerCase())) return 'inseguro';
  return null;
}

export function asegurarJwtSecret(env = process.env) {
  const motivo = motivoJwtInseguro(env.JWT_SECRET);
  if (!motivo) return;

  if (motivo === 'ausente') {
    throw new Error('JWT_SECRET ausente. Definí un secreto aleatorio de al menos 32 caracteres.');
  }
  throw new Error('JWT_SECRET inseguro. Usá un secreto aleatorio de al menos 32 caracteres, distinto de los valores de ejemplo.');
}
