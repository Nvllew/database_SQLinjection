import pool from '../config/db.js';

export const findAdminByUserId = async (userId) => {
  const [rows] = await pool.query(
    'SELECT id_admin FROM Administrador WHERE id_usuario = ? LIMIT 1',
    [userId]
  );
  return rows[0] || null;
};

export const findAllUsers = async (adminUserId = null, tiendaId = null) => {
  if (!adminUserId || !tiendaId) return []; 

  const [rows] = await pool.query(`
    SELECT u.*, e.tipo_jornada, e.horario_entrada, e.horario_salida, 
           a.nivel_acceso, a.permisos, a.id_admin_padre
    FROM Usuarios u
    LEFT JOIN Administrador a_padre ON u.id_usuario = a_padre.id_usuario
    LEFT JOIN Empleado e ON u.id_usuario = e.id_usuario
    LEFT JOIN Administrador a ON u.id_usuario = a.id_usuario
    WHERE u.id_tienda = ? AND (
           e.id_admin_creador = (SELECT id_admin FROM Administrador WHERE id_usuario = ?)
        OR a.id_admin_padre = (SELECT id_admin FROM Administrador WHERE id_usuario = ?)
        OR u.id_usuario = ?
    )
  `, [tiendaId, adminUserId, adminUserId, adminUserId]);

  return rows;
};


export const findUserByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT * FROM Usuarios WHERE correo = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

export const findUserByPhone = async (telefono) => {
  const [rows] = await pool.query(
    `SELECT * FROM Usuarios WHERE telefono = ? LIMIT 1`,
    [telefono]
  );
  return rows[0] || null;
};


export const checkDuplicadosGlobales = async (correo, telefono, excludeId = null) => {
  const fieldErrors = {};

  
  if (correo) {
    let params = [correo];
    let excludeUsr = '';
    
    
    if (excludeId) {
        excludeUsr = ' AND id_usuario != ?';
        params.push(excludeId);
    }
    
    
    params.push(correo, correo);

    const queryEmail = `
      SELECT 'usuario' AS origen FROM Usuarios WHERE correo = ? ${excludeUsr}
      UNION
      SELECT 'cliente' AS origen FROM Clientes WHERE correo = ?
      UNION
      SELECT 'proveedor' AS origen FROM Proveedores WHERE correo = ?
    `;

    const [emailResult] = await pool.query(queryEmail, params);
    
    if (emailResult.length > 0) {
      
      fieldErrors.email = `Este correo ya está registrado como ${emailResult[0].origen}.`;
    }
  }

  
  if (telefono) {
    let params = [telefono];
    let excludeUsr = '';
    
    if (excludeId) {
        excludeUsr = ' AND id_usuario != ?';
        params.push(excludeId);
    }
    
    params.push(telefono, telefono);

    const queryTel = `
      SELECT 'usuario' AS origen FROM Usuarios WHERE telefono = ? ${excludeUsr}
      UNION
      SELECT 'cliente' AS origen FROM Clientes WHERE telefono = ?
      UNION
      SELECT 'proveedor' AS origen FROM Proveedores WHERE telefono = ?
    `;

    const [telResult] = await pool.query(queryTel, params);
    
    if (telResult.length > 0) {
      fieldErrors.telefono = `Este teléfono ya pertenece a un ${telResult[0].origen}.`;
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
};

export const findUserById = async (id, tiendaId) => {
  // 💡 1. Eliminamos el "if (!tiendaId) return null;" que bloqueaba al invitado de inmediato

  let query = `
    SELECT u.*, e.tipo_jornada, e.horario_entrada, e.horario_salida, e.id_admin_creador,
           a.nivel_acceso, a.permisos 
    FROM Usuarios u 
    LEFT JOIN Empleado e ON u.id_usuario = e.id_usuario
    LEFT JOIN Administrador a ON u.id_usuario = a.id_usuario
    WHERE u.id_usuario = ?
  `;
  
  const params = [id];

  // 💡 2. Si tiene tienda la filtramos, si no, aceptamos explícitamente que sea NULL
  if (tiendaId) {
    query += " AND u.id_tienda = ?";
    params.push(tiendaId);
  } else {
    query += " AND u.id_tienda IS NULL";
  }

  query += " LIMIT 1";

  const [rows] = await pool.query(query, params);
  return rows[0] || null;
};

export const createUser = async (user) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      nombre_tienda, direccion_tienda, 
      id_tienda_existente,
      nombre, apellidos, telefono, email, password, rol, estado,
      id_admin_creador,
      id_admin_padre,
      tipo_jornada, horario_entrada, horario_salida,
      nivel_acceso, permisos
    } = user;

    let idTiendaFinal = id_tienda_existente;

    if (nombre_tienda) {
      const [tiendaResult] = await connection.query(
        `INSERT INTO Tiendas (nombre, direccion) VALUES (?, ?)`,
        [nombre_tienda, direccion_tienda || null]
      );
      idTiendaFinal = tiendaResult.insertId;
    }

    const [result] = await connection.query(
      `INSERT INTO Usuarios (id_tienda, nombre, telefono, correo, contrasena, rol, estado) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [idTiendaFinal || null, `${nombre} ${apellidos}`, telefono, email, password, rol, estado || 'ACTIVO']
    );

    const userId = result.insertId;

    if (rol === 'EMPLEADO' || rol === 'INVITADO') {
      await connection.query(
        `INSERT INTO Empleado (id_usuario, id_admin_creador, tipo_jornada, horario_entrada, horario_salida) VALUES (?, ?, ?, ?, ?)`,
        [userId, id_admin_creador, tipo_jornada, horario_entrada, horario_salida]
      );
    } else if (rol === 'ADMINISTRADOR') {
      await connection.query(
        `INSERT INTO Administrador (id_usuario, id_admin_padre, nivel_acceso, permisos) VALUES (?, ?, ?, ?)`,
        [userId, id_admin_padre, nivel_acceso, permisos]
      );
    }

    await connection.commit();
    return { id: userId, id_tienda: idTiendaFinal }; 
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateUserById = async (id, tiendaId, data) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [check] = await connection.query('SELECT id_usuario FROM Usuarios WHERE id_usuario = ? AND id_tienda = ?', [id, tiendaId]);
    if (check.length === 0) throw new Error("No tienes permisos para modificar este usuario");

    const {
      nombre, apellidos, telefono, email, password, estado,
      tipo_jornada, horario_entrada, horario_salida,
      nivel_acceso, permisos
    } = data;

    let userQuery = 'UPDATE Usuarios SET ';
    const userParams = [];

    if (nombre && apellidos) { userQuery += 'nombre = ?, '; userParams.push(`${nombre} ${apellidos}`); }
    if (telefono) { userQuery += 'telefono = ?, '; userParams.push(telefono); }
    if (email) { userQuery += 'correo = ?, '; userParams.push(email); }
    if (password) { userQuery += 'contrasena = ?, '; userParams.push(password); }
    if (estado) { userQuery += 'estado = ?, '; userParams.push(estado); }

    if (userParams.length > 0) {
      userQuery = userQuery.slice(0, -2) + ' WHERE id_usuario = ?';
      userParams.push(id);
      await connection.query(userQuery, userParams);
    }

    if (tipo_jornada || horario_entrada || horario_salida) {
      let empQuery = 'UPDATE Empleado SET ';
      const empParams = [];
      if (tipo_jornada) { empQuery += 'tipo_jornada = ?, '; empParams.push(tipo_jornada); }
      if (horario_entrada) { empQuery += 'horario_entrada = ?, '; empParams.push(horario_entrada); }
      if (horario_salida) { empQuery += 'horario_salida = ?, '; empParams.push(horario_salida); }

      empQuery = empQuery.slice(0, -2) + ' WHERE id_usuario = ?';
      empParams.push(id);
      await connection.query(empQuery, empParams);
    }

    if (nivel_acceso || permisos) {
      let admQuery = 'UPDATE Administrador SET ';
      const admParams = [];
      if (nivel_acceso) { admQuery += 'nivel_acceso = ?, '; admParams.push(nivel_acceso); }
      if (permisos) { admQuery += 'permisos = ?, '; admParams.push(permisos); }

      admQuery = admQuery.slice(0, -2) + ' WHERE id_usuario = ?';
      admParams.push(id);
      await connection.query(admQuery, admParams);
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteUserById = async (id, tiendaId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [check] = await connection.query('SELECT id_usuario FROM Usuarios WHERE id_usuario = ? AND id_tienda = ?', [id, tiendaId]);
    if (check.length === 0) throw new Error("No tienes permisos para eliminar este usuario");

    await connection.query('DELETE FROM Empleado WHERE id_usuario = ?', [id]);
    await connection.query('DELETE FROM Administrador WHERE id_usuario = ?', [id]);
    await connection.query('DELETE FROM Usuarios WHERE id_usuario = ?', [id]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
