export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const isDev = process.env.NODE_ENV === 'development';

  const response = {
    message: isDev ? err.message : 'Error interno del servidor',
  };

  if (isDev) {
    response.details = err.details || null;
  }

  console.error('[Error]', {
    status,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  res.status(status).json(response);
};
