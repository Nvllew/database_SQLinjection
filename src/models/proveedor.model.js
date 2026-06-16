import pool from '../config/db.js';


export const findAllCategorias = async () => {
  const [rows] = await pool.query(
    'SELECT * FROM Categoria ORDER BY categoria ASC'
  );
  return rows;
};


export const checkDuplicadosGlobales = async (correo, telefono, tiendaId, excludeId = null) => {
  const fieldErrors = {};

  
  if (correo) {
    let params = [correo];
    let excludeProv = '';
    
    
    if (excludeId) {
        excludeProv = ' AND id_proveedor != ?';
        params.push(excludeId);
    }
    
    
    params.push(correo, correo);

    const queryEmail = `
      SELECT 'proveedor' AS origen FROM Proveedores WHERE correo = ? ${excludeProv}
      UNION
      SELECT 'usuario' AS origen FROM Usuarios WHERE correo = ?
      UNION
      SELECT 'cliente' AS origen FROM Clientes WHERE correo = ?
    `;

    const [emailResult] = await pool.query(queryEmail, params);
    
    if (emailResult.length > 0) {
      
      fieldErrors.correo = [`Este correo ya está registrado como ${emailResult[0].origen}.`];
    }
  }

  
  if (telefono) {
    let params = [telefono];
    let excludeProv = '';
    
    if (excludeId) {
        excludeProv = ' AND id_proveedor != ?';
        params.push(excludeId);
    }
    
    params.push(telefono, telefono);

    const queryTel = `
      SELECT 'proveedor' AS origen FROM Proveedores WHERE telefono = ? ${excludeProv}
      UNION
      SELECT 'usuario' AS origen FROM Usuarios WHERE telefono = ?
      UNION
      SELECT 'cliente' AS origen FROM Clientes WHERE telefono = ?
    `;

    const [telResult] = await pool.query(queryTel, params);
    
    if (telResult.length > 0) {
      fieldErrors.telefono = [`Este teléfono ya pertenece a un ${telResult[0].origen}.`];
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
};


export const findAllProveedores = async (tiendaId) => {
  const [rows] = await pool.query(
    `SELECT 
      p.*, 
      c.categoria AS nombre_categoria,
      COUNT(prod.id_producto) AS total_productos
     FROM Proveedores p
     LEFT JOIN Categoria c ON p.id_categoria = c.id_categoria
     LEFT JOIN Productos prod ON p.id_proveedor = prod.id_proveedor
     WHERE p.id_tienda = ? 
     GROUP BY p.id_proveedor
     ORDER BY p.id_proveedor DESC`,
    [tiendaId]
  );
  return rows;
};

export const findProveedorById = async (id, tiendaId) => {
  const [rows] = await pool.query(
    `SELECT 
      p.*, 
      c.categoria AS nombre_categoria,
      COUNT(prod.id_producto) AS total_productos
     FROM Proveedores p
     LEFT JOIN Categoria c ON p.id_categoria = c.id_categoria
     LEFT JOIN Productos prod ON p.id_proveedor = prod.id_proveedor
     WHERE p.id_proveedor = ? AND p.id_tienda = ?
     GROUP BY p.id_proveedor`,
    [id, tiendaId]
  );
  return rows[0] || null;
};


export const createProveedor = async (data) => {
  const { id_tienda, id_categoria, nombre, telefono, correo, direccion, estado, tiempo_entregas } = data;
  
  const [result] = await pool.query(
    `INSERT INTO Proveedores (id_tienda, id_categoria, nombre, telefono, correo, direccion, estado, tiempo_entregas) 
     VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, 'ACTIVO'), ?)`,
    [
      id_tienda, 
      id_categoria || null, 
      nombre, 
      telefono || null, 
      correo || null, 
      direccion || null, 
      estado || null, 
      tiempo_entregas || null
    ]
  );
  return result.insertId;
};


export const updateProveedorById = async (id, tiendaId, data) => {
  const fields = [];
  const values = [];

  const { id_categoria, nombre, telefono, correo, direccion, estado, tiempo_entregas } = data;

  if (id_categoria !== undefined) { fields.push('id_categoria = ?'); values.push(id_categoria); }
  if (nombre !== undefined) { fields.push('nombre = ?'); values.push(nombre); }
  if (telefono !== undefined) { fields.push('telefono = ?'); values.push(telefono); }
  if (correo !== undefined) { fields.push('correo = ?'); values.push(correo); }
  if (direccion !== undefined) { fields.push('direccion = ?'); values.push(direccion); }
  if (estado !== undefined) { fields.push('estado = ?'); values.push(estado); } 
  if (tiempo_entregas !== undefined) { fields.push('tiempo_entregas = ?'); values.push(tiempo_entregas); }

  if (fields.length === 0) return true;

  const query = `UPDATE Proveedores SET ${fields.join(', ')} WHERE id_proveedor = ? AND id_tienda = ?`;
  values.push(id, tiendaId);

  const [result] = await pool.query(query, values);
  return result.affectedRows > 0;
};

export const deleteProveedorById = async (id, tiendaId) => {
  const [result] = await pool.query(
    "DELETE FROM Proveedores WHERE id_proveedor = ? AND id_tienda = ?", 
    [id, tiendaId]
  );
  return result.affectedRows > 0;
};

export const hardDeleteProveedorById = async (id, tiendaId) => {
  const [result] = await pool.query(
    'DELETE FROM Proveedores WHERE id_proveedor = ? AND id_tienda = ?', 
    [id, tiendaId]
  );
  return result.affectedRows > 0;
};