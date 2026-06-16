import pool from '../config/db.js';


export const findAllProducts = async (tiendaId) => {
  const [rows] = await pool.query(`
    SELECT 
      p.id_producto, 
      p.nombre, 
      p.cantidad, 
      p.precio_caja, 
      p.precio_unitario, 
      p.fecha_caducidad,
      p.id_proveedor, 
      pr.nombre AS proveedor_nombre,
      p.id_categoria, 
      c.categoria AS categoria_nombre
    FROM Productos p
    LEFT JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
    LEFT JOIN Categoria c ON p.id_categoria = c.id_categoria
    WHERE p.id_tienda = ?
    ORDER BY p.id_producto DESC
  `, [tiendaId]);
  return rows;
};


export const findProductById = async (id, tiendaId) => {
  const [rows] = await pool.query(`
    SELECT 
      p.id_producto, 
      p.nombre, 
      p.cantidad, 
      p.precio_caja, 
      p.precio_unitario, 
      p.fecha_caducidad,
      p.id_proveedor, 
      pr.nombre AS proveedor_nombre,
      p.id_categoria, 
      c.categoria AS categoria_nombre
    FROM Productos p
    LEFT JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
    LEFT JOIN Categoria c ON p.id_categoria = c.id_categoria
    WHERE p.id_producto = ? AND p.id_tienda = ?
  `, [id, tiendaId]);
  return rows[0] || null;
};


export const createProduct = async (productData) => {
  const {
    id_tienda, 
    id_proveedor,
    id_categoria,
    nombre,
    cantidad,
    precio_caja,
    precio_unitario,
    fecha_caducidad
  } = productData;

  const [result] = await pool.query(
    `INSERT INTO Productos 
    (id_tienda, id_proveedor, id_categoria, nombre, cantidad, precio_caja, precio_unitario, fecha_caducidad) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id_tienda, 
      id_proveedor || null, 
      id_categoria || null, 
      nombre, 
      cantidad || 0, 
      precio_caja, 
      precio_unitario, 
      fecha_caducidad || null
    ]
  );
  
  return result.insertId;
};


export const updateProductById = async (id, tiendaId, productData) => {
  const fieldsToUpdate = [];
  const values = [];

  const {
    id_proveedor,
    id_categoria,
    nombre,
    cantidad,
    precio_caja,
    precio_unitario,
    fecha_caducidad
  } = productData;

  if (id_proveedor !== undefined) { fieldsToUpdate.push('id_proveedor = ?'); values.push(id_proveedor); }
  if (id_categoria !== undefined) { fieldsToUpdate.push('id_categoria = ?'); values.push(id_categoria); }
  if (nombre !== undefined) { fieldsToUpdate.push('nombre = ?'); values.push(nombre); }
  if (cantidad !== undefined) { fieldsToUpdate.push('cantidad = ?'); values.push(cantidad); }
  if (precio_caja !== undefined) { fieldsToUpdate.push('precio_caja = ?'); values.push(precio_caja); }
  if (precio_unitario !== undefined) { fieldsToUpdate.push('precio_unitario = ?'); values.push(precio_unitario); }
  if (fecha_caducidad !== undefined) { fieldsToUpdate.push('fecha_caducidad = ?'); values.push(fecha_caducidad); }

  if (fieldsToUpdate.length === 0) return true;

  
  const query = `UPDATE Productos SET ${fieldsToUpdate.join(', ')} WHERE id_producto = ? AND id_tienda = ?`;
  values.push(id, tiendaId);

  const [result] = await pool.query(query, values);
  return result.affectedRows > 0;
};


export const deleteProductById = async (id, tiendaId) => {
  
  const [result] = await pool.query('DELETE FROM Productos WHERE id_producto = ? AND id_tienda = ?', [id, tiendaId]);
  return result.affectedRows > 0;
};