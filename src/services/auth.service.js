import { loginSchema, registerSchema, updateSchema } from '../schemas/user.schema.js';
import {
  findUserByEmail,
  createUser,
  findUserById,
  findAllUsers,
  updateUserById,
  deleteUserById,
  findAdminByUserId,
  checkDuplicadosGlobales 
} from '../models/user.model.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signToken } from '../utils/jwt.js';

export const loginUser = async (data) => {
  const validation = loginSchema.safeParse(data);
  if (!validation.success) {
    const formattedErrors = {};
    validation.error.issues.forEach((issue) => {
      formattedErrors[issue.path[0]] = issue.message;
    });

    const err = new Error('Error de validación');
    err.status = 400;
    err.errors = formattedErrors; 
    throw err;
  }

  const { email, password } = validation.data;
  const user = await findUserByEmail(email);

  if (!user || user.estado !== 'ACTIVO' || !(await comparePassword(password, user.contrasena))) {
    const err = new Error('Credenciales inválidas o usuario inactivo');
    err.status = 401;
    err.errors = { email: 'Revisa tu correo', password: 'O tu contraseña es incorrecta' }; 
    throw err;
  }

  const token = signToken({
    sub: user.id_usuario,
    email: user.correo,
    rol: user.rol,
    id_tienda: user.id_tienda 
  });

  return {
    user: {
      id: user.id_usuario,
      nombre: user.nombre,
      email: user.correo,
      rol: user.rol,
      id_tienda: user.id_tienda
    },
    token
  };
};

export const registerUser = async (data, creatorUserId, creatorTiendaId) => {
  const validation = registerSchema.safeParse(data);
  if (!validation.success) {
    const formattedErrors = {};
    validation.error.issues.forEach((issue) => {
      formattedErrors[issue.path[0]] = issue.message;
    });

    const err = new Error('Revisa los datos enviados');
    err.status = 400;
    err.errors = formattedErrors; 
    throw err;
  }

  const validData = { ...validation.data };

  if (!creatorUserId) {
    validData.rol = 'ADMINISTRADOR';
    validData.nivel_acceso = 'TOTAL'; 
    validData.id_admin_padre = null;

    if (!validData.nombre_tienda) {
      const err = new Error('Se requiere el nombre de la sucursal para un registro nuevo.');
      err.status = 400;
      err.errors = { nombre_tienda: 'Se requiere el nombre de la sucursal' }; 
      throw err;
    }
  } else {
    validData.id_tienda_existente = creatorTiendaId; 

    const adminInfo = await findAdminByUserId(creatorUserId);

    if (!adminInfo) {
      const err = new Error('Acción no autorizada: Se requiere una sesión de administrador.');
      err.status = 403;
      throw err;
    }

    if (validData.rol === 'EMPLEADO' || validData.rol === 'INVITADO') {
      validData.id_admin_creador = adminInfo.id_admin;
    } else if (validData.rol === 'ADMINISTRADOR') {
      validData.id_admin_padre = adminInfo.id_admin;
    }
  }

  
  const duplicados = await checkDuplicadosGlobales(validData.email, validData.telefono);
  
  if (duplicados) {
    const err = new Error('Algunos datos ya están registrados en el sistema');
    err.status = 409;
    err.errors = duplicados; 
    throw err;
  }

  validData.password = await hashPassword(validData.password);

  const newUser = await createUser(validData);

  const token = signToken({
    sub: newUser.id,
    email: validData.email,
    rol: validData.rol,
    id_tienda: newUser.id_tienda
  });

  return {
    user: {
      id: newUser.id,
      nombre: validData.nombre,
      email: validData.email,
      rol: validData.rol,
      id_tienda: newUser.id_tienda
    },
    token
  };
};

export const getAllUsers = async (adminUserId, tiendaId) => {
  const users = await findAllUsers(adminUserId, tiendaId);
  return users.map(({ contrasena, ...user }) => user);
};

export const getProfile = async (userId, tiendaId) => {
  const user = await findUserById(userId, tiendaId);
  if (!user) {
    const err = new Error('Usuario no encontrado o no pertenece a tu sucursal');
    err.status = 404;
    throw err;
  }
  const { contrasena, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const updateUser = async (userId, tiendaId, data, actor = null) => {
  
  const validation = updateSchema.safeParse(data);
  if (!validation.success) {
    const formattedErrors = {};
    validation.error.issues.forEach((issue) => {
      formattedErrors[issue.path[0]] = issue.message;
    });

    const err = new Error('Revisa los datos enviados');
    err.status = 400;
    err.errors = formattedErrors; 
    throw err;
  }

  const validData = { ...validation.data };
  const actorRole = String(actor?.rol || '').toUpperCase();
  const actorId = Number(actor?.sub);
  const targetId = Number(userId);
  const isAdmin = actorRole === 'ADMINISTRADOR';

  if (!isAdmin && actorId !== targetId) {
    const err = new Error('No tienes permisos para modificar este usuario');
    err.status = 403;
    throw err;
  }

  if (!isAdmin) {
    delete validData.estado;
    delete validData.rol;
    delete validData.tipo_jornada;
    delete validData.horario_entrada;
    delete validData.horario_salida;
    delete validData.nivel_acceso;
    delete validData.permisos;
    delete validData.nombre_tienda;
    delete validData.direccion_tienda;
  }

  
  if (validData.email || validData.telefono) {
    const duplicados = await checkDuplicadosGlobales(validData.email, validData.telefono, userId);
    
    if (duplicados) {
      const err = new Error('Ya existe otro registro con esos datos');
      err.status = 409;
      err.errors = duplicados;
      throw err;
    }
  }

  
  if (validData.password && validData.password.trim() !== '') {
    validData.password = await hashPassword(validData.password);
  } else {
    delete validData.password;
  }

  const result = await updateUserById(userId, tiendaId, validData);
  if (!result) {
    const err = new Error('No se pudo actualizar el usuario');
    err.status = 500;
    throw err;
  }
  return { message: 'Usuario actualizado con éxito' };
};

export const deleteUser = async (userId, tiendaId) => {
  const result = await deleteUserById(userId, tiendaId);
  if (!result) {
    const err = new Error('No se pudo eliminar el usuario');
    err.status = 500;
    throw err;
  }
  return { message: 'Usuario eliminado con éxito' };
};
