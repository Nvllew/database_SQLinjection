
const normalizeRole = (role) => String(role || '').trim().toUpperCase();

export const preventGuestWrites = (req, res, next) => {
  const userRole = normalizeRole(req.user?.rol);

  if (userRole === 'INVITADO' && req.method !== 'GET') {
    return res.status(403).json({ 
      error: "Acceso denegado", 
      message: "Tu cuenta de invitado solo tiene permisos de lectura." 
    });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (normalizeRole(req.user?.rol) !== 'ADMINISTRADOR') {
    return res.status(403).json({
      error: "Acceso denegado",
      message: "Se requiere una cuenta de administrador."
    });
  }

  next();
};
