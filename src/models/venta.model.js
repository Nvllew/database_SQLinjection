import pool from '../config/db.js';


export const findAllVentas = async (tiendaId) => {
  const [rows] = await pool.query(`
    SELECT 
      v.id_venta, 
      v.fecha_hora,     
      v.total,
      v.metodo_pago,
      v.estado,         -- 💡 NUEVO: Traemos el estado para saber si fue cancelada
      c.nombre AS cliente_nombre,
      u.nombre AS vendedor_nombre
    FROM Venta v
    JOIN Clientes c ON v.id_cliente = c.id_cliente
    JOIN Usuarios u ON v.id_usuario = u.id_usuario
    WHERE v.id_tienda = ?
    ORDER BY v.id_venta DESC
  `, [tiendaId]);
  return rows;
};


export const findVentaCompletaById = async (idVenta, tiendaId) => {
  
  const [ventaRows] = await pool.query(`
    SELECT v.*, c.nombre AS cliente_nombre, u.nombre AS vendedor_nombre 
    FROM Venta v
    JOIN Clientes c ON v.id_cliente = c.id_cliente
    JOIN Usuarios u ON v.id_usuario = u.id_usuario
    WHERE v.id_venta = ? AND v.id_tienda = ?
  `, [idVenta, tiendaId]);

  const venta = ventaRows[0];
  if (!venta) return null;

  const [detalles] = await pool.query(`
    SELECT 
      dv.id_detalle, 
      dv.cantidad, 
      dv.precio_unitario_venta, 
      dv.subtotal,
      p.nombre AS producto_nombre
    FROM Detalle_venta dv
    JOIN Productos p ON dv.id_producto = p.id_producto
    WHERE dv.id_venta = ?
  `, [idVenta]);

  return { ...venta, detalles };
};


export const createVentaTransaccion = async (ventaData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id_tienda, id_cliente, id_usuario, metodo_pago, detalles } = ventaData;

    const [clienteRows] = await connection.query(
      `SELECT id_cliente FROM Clientes WHERE id_cliente = ? AND id_tienda = ? LIMIT 1`,
      [id_cliente, id_tienda]
    );

    if (clienteRows.length === 0) {
      const err = new Error('Cliente inválido o no pertenece a tu sucursal');
      err.status = 400;
      throw err;
    }

    const detallesCalculados = [];
    let totalCalculado = 0;

    for (const item of detalles) {
      const [productRows] = await connection.query(
        `SELECT id_producto, precio_unitario, cantidad
         FROM Productos
         WHERE id_producto = ? AND id_tienda = ?
         FOR UPDATE`,
        [item.id_producto, id_tienda]
      );

      const product = productRows[0];
      if (!product || product.cantidad < item.cantidad) {
        const err = new Error(`Stock insuficiente o producto inválido para el ID: ${item.id_producto}`);
        err.status = 400;
        throw err;
      }

      const precioUnitario = Number(product.precio_unitario);
      const subtotal = precioUnitario * item.cantidad;
      totalCalculado += subtotal;
      detallesCalculados.push({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario_venta: precioUnitario
      });
    }

    
    const [ventaResult] = await connection.query(
      `INSERT INTO Venta (id_tienda, id_cliente, id_usuario, metodo_pago, total) 
       VALUES (?, ?, ?, ?, ?)`,
      [id_tienda, id_cliente, id_usuario, metodo_pago, totalCalculado]
    );
    const idVenta = ventaResult.insertId;

    
    for (const item of detallesCalculados) {
      const { id_producto, cantidad, precio_unitario_venta } = item;

      
      await connection.query(
        `INSERT INTO Detalle_venta (id_venta, id_producto, cantidad, precio_unitario_venta) 
         VALUES (?, ?, ?, ?)`,
        [idVenta, id_producto, cantidad, precio_unitario_venta]
      );

      
      const [updateResult] = await connection.query(
        `UPDATE Productos 
         SET cantidad = cantidad - ? 
         WHERE id_producto = ? AND id_tienda = ? AND cantidad >= ?`,
        [cantidad, id_producto, id_tienda, cantidad]
      );

      if (updateResult.affectedRows === 0) {
        const err = new Error(`Stock insuficiente o producto inválido para el ID: ${id_producto}`);
        err.status = 400; 
        throw err;
      }
    }

    await connection.commit();
    return { idVenta, total: totalCalculado };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};


export const cancelVentaTransaccion = async (idVenta, tiendaId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    
    const [ventaCheck] = await connection.query(
      `SELECT estado FROM Venta WHERE id_venta = ? AND id_tienda = ? FOR UPDATE`,
      [idVenta, tiendaId]
    );

    
    if (ventaCheck.length === 0) {
      const err = new Error('La venta no existe o no pertenece a tu sucursal');
      err.status = 404;
      throw err;
    }

    if (ventaCheck[0].estado === 'CANCELADA') {
      const err = new Error('Esta venta ya había sido cancelada previamente');
      err.status = 400;
      throw err;
    }

    
    await connection.query(
      `UPDATE Venta SET estado = 'CANCELADA' WHERE id_venta = ?`,
      [idVenta]
    );

    
    const [detalles] = await connection.query(
      `SELECT id_producto, cantidad FROM Detalle_venta WHERE id_venta = ?`,
      [idVenta]
    );

    
    for (const item of detalles) {
      await connection.query(
        `UPDATE Productos 
         SET cantidad = cantidad + ? 
         WHERE id_producto = ? AND id_tienda = ?`,
        [item.cantidad, item.id_producto, tiendaId]
      );
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
