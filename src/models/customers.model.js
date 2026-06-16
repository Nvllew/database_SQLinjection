import pool from '../config/db.js';


export const findAllClientes = async (tiendaId) => {
  const [rows] = await pool.query(
    `SELECT * FROM Clientes 
     WHERE id_tienda = ? 
     ORDER BY id_cliente DESC`,
    [tiendaId]
  );
  return rows;
};


export const findClienteById = async (idCliente, tiendaId) => {
  const [rows] = await pool.query(
    `SELECT * FROM Clientes 
     WHERE id_cliente = ? AND id_tienda = ?`,
    [idCliente, tiendaId]
  );
  return rows[0] || null;
};



export const checkDuplicadosCliente = async (correo, telefono, rfc, tiendaId, excludeId = null) => {
  const fieldErrors = {};

  
  if (correo) {
    let params = [correo];
    let excludeCli = '';
    if (excludeId) { excludeCli = ' AND id_cliente != ?'; params.push(excludeId); }
    params.push(correo, correo);

    const queryEmail = `
      SELECT 'cliente' AS origen FROM Clientes WHERE correo = ? ${excludeCli}
      UNION
      SELECT 'usuario' AS origen FROM Usuarios WHERE correo = ?
      UNION
      SELECT 'proveedor' AS origen FROM Proveedores WHERE correo = ?
    `;
    const [emailResult] = await pool.query(queryEmail, params);
    if (emailResult.length > 0) fieldErrors.email = `Este correo ya está registrado como ${emailResult[0].origen}.`;
  }

  
  if (telefono) {
    let params = [telefono];
    let excludeCli = '';
    if (excludeId) { excludeCli = ' AND id_cliente != ?'; params.push(excludeId); }
    params.push(telefono, telefono);

    const queryTel = `
      SELECT 'cliente' AS origen FROM Clientes WHERE telefono = ? ${excludeCli}
      UNION
      SELECT 'usuario' AS origen FROM Usuarios WHERE telefono = ?
      UNION
      SELECT 'proveedor' AS origen FROM Proveedores WHERE telefono = ?
    `;
    const [telResult] = await pool.query(queryTel, params);
    if (telResult.length > 0) fieldErrors.telefono = `Este teléfono ya pertenece a un ${telResult[0].origen}.`;
  }

  
  if (rfc) {
    let params = [rfc];
    let excludeCli = '';
    
    if (excludeId) {
        excludeCli = ' AND id_cliente != ?';
        params.push(excludeId);
    }

    const queryRFC = `SELECT 'cliente' AS origen FROM Clientes WHERE RFC = ? ${excludeCli}`;
    const [rfcResult] = await pool.query(queryRFC, params);
    
    if (rfcResult.length > 0) {
      fieldErrors.RFC = "Este RFC ya está registrado en otro cliente.";
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
};


export const createCliente = async (data) => {
  const { id_tienda, nombre, direccion, telefono, email, RFC } = data;
  
  const [result] = await pool.query(
    `INSERT INTO Clientes (id_tienda, nombre, direccion, telefono, correo, RFC) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id_tienda, nombre, direccion, telefono, email, RFC || null]
  );
  
  return result.insertId;
};


export const updateClienteById = async (idCliente, tiendaId, data) => {
  const fields = [];
  const values = [];

  const { nombre, direccion, telefono, email, RFC } = data;

  if (nombre !== undefined) { fields.push('nombre = ?'); values.push(nombre); }
  if (direccion !== undefined) { fields.push('direccion = ?'); values.push(direccion); }
  if (telefono !== undefined) { fields.push('telefono = ?'); values.push(telefono); }
  
  if (email !== undefined) { fields.push('correo = ?'); values.push(email); }
  if (RFC !== undefined) { fields.push('RFC = ?'); values.push(RFC); }

  if (fields.length === 0) return true;

  const query = `UPDATE Clientes SET ${fields.join(', ')} WHERE id_cliente = ? AND id_tienda = ?`;
  values.push(idCliente, tiendaId);

  const [result] = await pool.query(query, values);
  return result.affectedRows > 0;
};


export const deleteClienteById = async (idCliente, tiendaId) => {
  const [result] = await pool.query(
    "DELETE FROM Clientes WHERE id_cliente = ? AND id_tienda = ?", 
    [idCliente, tiendaId]
  );
  return result.affectedRows > 0;
};