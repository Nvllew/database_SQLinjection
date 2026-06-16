import {
  registerUser,
  loginUser,
  getProfile,
  getAllUsers,
  updateUser,
  deleteUser
} from '../services/auth.service.js';

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    
    res.status(200).json(result);
  } catch (error) {
    
    if (error.errors) {
      return res.status(error.status || 400).json({
        message: error.message,
        errors: error.errors
      });
    }
    
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    
    const creatorUserId = req.user?.sub;
    const creatorTiendaId = req.user?.id_tienda; 

    
    const result = await registerUser(req.body, creatorUserId, creatorTiendaId);
    res.status(201).json(result);
  } catch (error) {
    
    if (error.errors) {
      return res.status(error.status || 400).json({
        message: error.message,
        errors: error.errors
      });
    }
    next(error);
  }
}

export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.sub; 
    const tiendaId = req.user.id_tienda;
    const profile = await getProfile(userId, tiendaId);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};






export const getUsers = async (req, res, next) => {
  try {
    const adminUserId = req.user.sub; 
    const tiendaId = req.user.id_tienda; 

    const users = await getAllUsers(adminUserId, tiendaId);
    res.status(200).json(users);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al obtener usuarios' });
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tiendaId = req.user.id_tienda; 

    const result = await updateUser(id, tiendaId, req.body, req.user);
    res.status(200).json(result);
  } catch (error) {
    if (error.errors) {
      return res.status(error.status || 400).json({
        message: error.message,
        errors: error.errors
      });
    }
    res.status(error.status || 500).json({ message: error.message || 'Error al actualizar el usuario' });
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tiendaId = req.user.id_tienda; 

    const result = await deleteUser(id, tiendaId);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al eliminar el usuario' });
  }
};
