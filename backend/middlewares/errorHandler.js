export const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'La imagen supera el tamaño máximo permitido (5 MB)'
      : `Error al subir el archivo: ${err.message}`;
    return res.status(400).json({ success: false, message });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'El registro ya existe' });
  }

  const status = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Error interno del servidor'
    : err.message || 'Error interno del servidor';

  res.status(status).json({ success: false, message });
};

export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Ruta no encontrada: ${req.originalUrl}` });
};
