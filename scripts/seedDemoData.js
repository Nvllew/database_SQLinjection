import { randomUUID } from 'node:crypto';

import pool from '../src/config/db.js';
import { hashPassword } from '../src/utils/hash.js';
import { registerUser } from '../src/services/auth.service.js';
import { addCliente } from '../src/services/customers.service.js';
import { addProveedor } from '../src/services/proveedor.service.js';
import { addProduct } from '../src/services/product.service.js';
import { addVenta } from '../src/services/venta.service.js';
import { createEvaluationService } from '../src/services/evaluations.service.js';
import { findAdminByUserId, findUserByEmail } from '../src/models/user.model.js';

const demoPassword = 'Demo1234!';

const logStep = (message) => {
  console.log(`\n[seed] ${message}`);
};

const getFirstRow = async (query, params = []) => {
  const [rows] = await pool.query(query, params);
  return rows[0] || null;
};

const tableExists = async (tableName) => {
  const row = await getFirstRow(
    `SELECT 1 AS found
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?
     LIMIT 1`,
    [tableName]
  );
  return Boolean(row);
};

const columnExists = async (tableName, columnName) => {
  const row = await getFirstRow(
    `SELECT 1 AS found
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND column_name = ?
     LIMIT 1`,
    [tableName, columnName]
  );
  return Boolean(row);
};

const detectSchema = async () => {
  const hasDatabaseSqlShape =
    (await tableExists('Categorias')) &&
    (await columnExists('Usuarios', 'email')) &&
    (await columnExists('Usuarios', 'password_hash')) &&
    (await columnExists('Productos', 'precio_venta'));

  if (hasDatabaseSqlShape) return 'database_sql';

  const hasAppShape =
    (await tableExists('Categoria')) &&
    (await columnExists('Usuarios', 'correo')) &&
    (await columnExists('Usuarios', 'contrasena')) &&
    (await columnExists('Productos', 'precio_unitario'));

  if (hasAppShape) return 'app';

  throw new Error(
    'No se reconocio el esquema de la base. Ejecuta primero database.sql o el SQL compatible con el backend actual.'
  );
};

const ensureAppCategory = async (categoria) => {
  const existing = await getFirstRow(
    'SELECT id_categoria FROM Categoria WHERE categoria = ? LIMIT 1',
    [categoria]
  );

  if (existing) {
    console.log(`Categoria reutilizada: ${categoria}`);
    return existing.id_categoria;
  }

  const [result] = await pool.query(
    'INSERT INTO Categoria (categoria) VALUES (?)',
    [categoria]
  );

  console.log(`Categoria creada: ${categoria}`);
  return result.insertId;
};

const ensureAppUser = async (userData, creator = null) => {
  const existing = await findUserByEmail(userData.email);
  if (existing) {
    console.log(`Usuario reutilizado: ${userData.email}`);
    return existing;
  }

  const created = await registerUser(
    userData,
    creator?.id_usuario || null,
    creator?.id_tienda || null
  );

  const user = await findUserByEmail(userData.email);
  console.log(`Usuario creado: ${userData.email}`);
  return user || {
    id_usuario: created.user.id,
    id_tienda: created.user.id_tienda,
    correo: created.user.email,
    rol: created.user.rol
  };
};

const ensureAppCliente = async (clienteData) => {
  const existing = await getFirstRow(
    'SELECT id_cliente FROM Clientes WHERE correo = ? LIMIT 1',
    [clienteData.email]
  );

  if (existing) {
    console.log(`Cliente reutilizado: ${clienteData.email}`);
    return existing.id_cliente;
  }

  const created = await addCliente(clienteData);
  console.log(`Cliente creado: ${clienteData.email}`);
  return created.id_cliente;
};

const ensureAppProveedor = async (proveedorData) => {
  const existing = await getFirstRow(
    'SELECT id_proveedor FROM Proveedores WHERE correo = ? LIMIT 1',
    [proveedorData.correo]
  );

  if (existing) {
    console.log(`Proveedor reutilizado: ${proveedorData.correo}`);
    return existing.id_proveedor;
  }

  const created = await addProveedor(proveedorData);
  console.log(`Proveedor creado: ${proveedorData.correo}`);
  return created.id_proveedor;
};

const ensureAppProduct = async (productData) => {
  const existing = await getFirstRow(
    'SELECT id_producto FROM Productos WHERE id_tienda = ? AND nombre = ? LIMIT 1',
    [productData.id_tienda, productData.nombre]
  );

  if (existing) {
    await pool.query(
      `UPDATE Productos
       SET cantidad = GREATEST(cantidad, ?),
           id_proveedor = ?,
           id_categoria = ?,
           precio_caja = ?,
           precio_unitario = ?,
           fecha_caducidad = ?
       WHERE id_producto = ?`,
      [
        productData.cantidad,
        productData.id_proveedor,
        productData.id_categoria,
        productData.precio_caja,
        productData.precio_unitario,
        productData.fecha_caducidad || null,
        existing.id_producto
      ]
    );
    console.log(`Producto reutilizado y abastecido: ${productData.nombre}`);
    return existing.id_producto;
  }

  const created = await addProduct(productData);
  console.log(`Producto creado: ${productData.nombre}`);
  return created.id_producto;
};

const ensureAppEvaluation = async ({ id_usuario, calificacion, comentario, approve = false }) => {
  const existing = await getFirstRow(
    'SELECT id_evaluacion FROM Evaluaciones WHERE id_usuario = ? AND comentario = ? LIMIT 1',
    [id_usuario, comentario]
  );

  if (existing) {
    if (approve) {
      await pool.query(
        "UPDATE Evaluaciones SET estado = 'APROBADA' WHERE id_evaluacion = ?",
        [existing.id_evaluacion]
      );
    }
    console.log(`Evaluacion reutilizada: ${comentario.slice(0, 40)}...`);
    return existing.id_evaluacion;
  }

  const created = await createEvaluationService(id_usuario, calificacion, comentario);
  if (approve) {
    await pool.query(
      "UPDATE Evaluaciones SET estado = 'APROBADA' WHERE id_evaluacion = ?",
      [created.id_evaluacion]
    );
  }
  console.log(`Evaluacion creada: ${comentario.slice(0, 40)}...`);
  return created.id_evaluacion;
};

const getAppExpectedTotal = async (tiendaId, detalles) => {
  let total = 0;

  for (const detalle of detalles) {
    const product = await getFirstRow(
      'SELECT precio_unitario FROM Productos WHERE id_producto = ? AND id_tienda = ? LIMIT 1',
      [detalle.id_producto, tiendaId]
    );

    if (!product) {
      throw new Error(`No se encontro producto para calcular venta: ${detalle.id_producto}`);
    }

    total += Number(product.precio_unitario) * detalle.cantidad;
  }

  return total;
};

const ensureAppSale = async ({ tiendaId, clienteId, usuarioId, metodo_pago, detalles }) => {
  const expectedTotal = await getAppExpectedTotal(tiendaId, detalles);
  const existing = await getFirstRow(
    `SELECT id_venta
     FROM Venta
     WHERE id_tienda = ?
       AND id_cliente = ?
       AND id_usuario = ?
       AND metodo_pago = ?
       AND total = ?
     LIMIT 1`,
    [tiendaId, clienteId, usuarioId, metodo_pago, expectedTotal]
  );

  if (existing) {
    console.log(`Venta reutilizada: #${existing.id_venta} total ${expectedTotal}`);
    return existing.id_venta;
  }

  const venta = await addVenta({
    id_tienda: tiendaId,
    id_cliente: clienteId,
    id_usuario: usuarioId,
    metodo_pago,
    detalles
  });

  console.log(`Venta creada: #${venta.id_venta} total ${venta.total}`);
  return venta.id_venta;
};

const seedAppSchema = async () => {
  logStep('Creando categorias base para esquema del backend actual');
  const categorias = {
    abarrotes: await ensureAppCategory('Abarrotes'),
    bebidas: await ensureAppCategory('Bebidas'),
    limpieza: await ensureAppCategory('Limpieza'),
    lacteos: await ensureAppCategory('Lacteos')
  };

  logStep('Creando tienda y usuarios con servicios de la aplicacion');
  const admin = await ensureAppUser({
    nombre: 'Andrea',
    apellidos: 'Martinez',
    telefono: '5510000001',
    email: 'admin.demo@scynara.com',
    password: demoPassword,
    rol: 'ADMINISTRADOR',
    nivel_acceso: 'TOTAL',
    permisos: 'ACCESO_TOTAL',
    nombre_tienda: 'Scynara Demo Centro',
    direccion_tienda: 'Av. Demo 123, Centro, Ciudad de Mexico',
    estado: 'ACTIVO'
  });

  const adminInfo = await findAdminByUserId(admin.id_usuario);
  if (!adminInfo) {
    throw new Error('No se encontro registro de administrador para el usuario demo.');
  }

  const empleado = await ensureAppUser({
    nombre: 'Carlos',
    apellidos: 'Lopez',
    telefono: '5510000002',
    email: 'cajero.demo@scynara.com',
    password: demoPassword,
    rol: 'EMPLEADO',
    tipo_jornada: 'Completa',
    horario_entrada: '08:00',
    horario_salida: '16:00',
    estado: 'ACTIVO'
  }, admin);

  const invitado = await ensureAppUser({
    nombre: 'Ivana',
    apellidos: 'Reyes',
    telefono: '5510000003',
    email: 'invitado.demo@scynara.com',
    password: demoPassword,
    rol: 'INVITADO',
    tipo_jornada: 'Medio',
    horario_entrada: '10:00',
    horario_salida: '14:00',
    estado: 'ACTIVO'
  }, admin);

  logStep('Creando proveedores');
  const proveedorAbarrotes = await ensureAppProveedor({
    id_tienda: admin.id_tienda,
    id_categoria: categorias.abarrotes,
    nombre: 'Distribuidora La Central',
    telefono: '5551112233',
    correo: 'ventas.central@proveedores-demo.com',
    direccion: 'Bodega 45, Mercado Central',
    estado: 'ACTIVO',
    tiempo_entregas: '24 a 48 horas'
  });

  const proveedorBebidas = await ensureAppProveedor({
    id_tienda: admin.id_tienda,
    id_categoria: categorias.bebidas,
    nombre: 'Bebidas del Valle',
    telefono: '5552223344',
    correo: 'contacto.valle@proveedores-demo.com',
    direccion: 'Parque Industrial Norte 10',
    estado: 'ACTIVO',
    tiempo_entregas: '48 horas'
  });

  const proveedorLimpieza = await ensureAppProveedor({
    id_tienda: admin.id_tienda,
    id_categoria: categorias.limpieza,
    nombre: 'Limpieza Total MX',
    telefono: '5553334455',
    correo: 'pedidos@limpiezatotal-demo.com',
    direccion: 'Calle Higiene 75',
    estado: 'ACTIVO',
    tiempo_entregas: '3 dias'
  });

  logStep('Creando clientes');
  const clienteAna = await ensureAppCliente({
    id_tienda: admin.id_tienda,
    nombre: 'Ana Torres',
    direccion: 'Calle Olivo 10, Colonia Centro',
    telefono: '5512345678',
    email: 'ana.torres.demo@clientes.com',
    RFC: 'TOAA9001011A1'
  });

  const clienteLuis = await ensureAppCliente({
    id_tienda: admin.id_tienda,
    nombre: 'Luis Hernandez',
    direccion: 'Av. Reforma 200, Colonia Norte',
    telefono: '5598765432',
    email: 'luis.hernandez.demo@clientes.com',
    RFC: 'HEGL8505052B2'
  });

  const clienteMaya = await ensureAppCliente({
    id_tienda: admin.id_tienda,
    nombre: 'Maya Castillo',
    direccion: 'Privada Lago 32, Colonia Sur',
    telefono: '5511122233',
    email: 'maya.castillo.demo@clientes.com',
    RFC: null
  });

  logStep('Creando productos e inventario');
  const arroz = await ensureAppProduct({
    id_tienda: admin.id_tienda,
    id_proveedor: proveedorAbarrotes,
    id_categoria: categorias.abarrotes,
    nombre: 'Arroz super extra 1kg',
    cantidad: 120,
    precio_caja: 420,
    precio_unitario: 22,
    fecha_caducidad: '2027-12-31'
  });

  const cafe = await ensureAppProduct({
    id_tienda: admin.id_tienda,
    id_proveedor: proveedorAbarrotes,
    id_categoria: categorias.abarrotes,
    nombre: 'Cafe molido premium 500g',
    cantidad: 80,
    precio_caja: 980,
    precio_unitario: 85,
    fecha_caducidad: '2027-08-15'
  });

  const agua = await ensureAppProduct({
    id_tienda: admin.id_tienda,
    id_proveedor: proveedorBebidas,
    id_categoria: categorias.bebidas,
    nombre: 'Agua natural 1L',
    cantidad: 200,
    precio_caja: 180,
    precio_unitario: 12,
    fecha_caducidad: '2027-05-20'
  });

  const detergente = await ensureAppProduct({
    id_tienda: admin.id_tienda,
    id_proveedor: proveedorLimpieza,
    id_categoria: categorias.limpieza,
    nombre: 'Detergente liquido 2L',
    cantidad: 60,
    precio_caja: 760,
    precio_unitario: 95,
    fecha_caducidad: null
  });

  const leche = await ensureAppProduct({
    id_tienda: admin.id_tienda,
    id_proveedor: proveedorAbarrotes,
    id_categoria: categorias.lacteos,
    nombre: 'Leche entera 1L',
    cantidad: 90,
    precio_caja: 360,
    precio_unitario: 24,
    fecha_caducidad: '2026-09-30'
  });

  logStep('Creando ventas con validacion de stock y transacciones');
  await ensureAppSale({
    tiendaId: admin.id_tienda,
    clienteId: clienteAna,
    usuarioId: empleado.id_usuario,
    metodo_pago: 'EFECTIVO',
    detalles: [
      { id_producto: arroz, cantidad: 2, precio_unitario_venta: 22 },
      { id_producto: agua, cantidad: 4, precio_unitario_venta: 12 }
    ]
  });

  await ensureAppSale({
    tiendaId: admin.id_tienda,
    clienteId: clienteLuis,
    usuarioId: empleado.id_usuario,
    metodo_pago: 'TARJETA',
    detalles: [
      { id_producto: cafe, cantidad: 1, precio_unitario_venta: 85 },
      { id_producto: leche, cantidad: 3, precio_unitario_venta: 24 }
    ]
  });

  await ensureAppSale({
    tiendaId: admin.id_tienda,
    clienteId: clienteMaya,
    usuarioId: empleado.id_usuario,
    metodo_pago: 'TRANSFERENCIA',
    detalles: [
      { id_producto: detergente, cantidad: 1, precio_unitario_venta: 95 },
      { id_producto: agua, cantidad: 2, precio_unitario_venta: 12 }
    ]
  });

  logStep('Creando evaluaciones');
  await ensureAppEvaluation({
    id_usuario: admin.id_usuario,
    calificacion: 5,
    comentario: 'La plataforma demo permite administrar la tienda de forma clara y segura.',
    approve: true
  });

  await ensureAppEvaluation({
    id_usuario: empleado.id_usuario,
    calificacion: 4,
    comentario: 'El flujo de ventas y control de inventario funciona correctamente.',
    approve: true
  });

  await ensureAppEvaluation({
    id_usuario: invitado.id_usuario,
    calificacion: 5,
    comentario: 'La cuenta de invitado permite revisar informacion sin modificar registros.',
    approve: true
  });

  return [
    { tipo: 'Admin', email: 'admin.demo@scynara.com', password: demoPassword },
    { tipo: 'Empleado', email: 'cajero.demo@scynara.com', password: demoPassword },
    { tipo: 'Invitado', email: 'invitado.demo@scynara.com', password: demoPassword }
  ];
};

const ensureDbSqlTienda = async () => {
  const existing = await getFirstRow(
    'SELECT id_tienda FROM Tiendas WHERE nombre = ? LIMIT 1',
    ['Scynara Demo Centro']
  );

  if (existing) {
    console.log('Tienda reutilizada: Scynara Demo Centro');
    return existing.id_tienda;
  }

  const [result] = await pool.query(
    `INSERT INTO Tiendas (nombre, direccion, telefono, galeria_fotos)
     VALUES (?, ?, ?, ?)`,
    [
      'Scynara Demo Centro',
      'Av. Demo 123, Centro, Ciudad de Mexico',
      '5550001122',
      JSON.stringify([
        'https://example.com/scynara/demo-local-1.jpg',
        'https://example.com/scynara/demo-local-2.jpg'
      ])
    ]
  );

  console.log('Tienda creada: Scynara Demo Centro');
  return result.insertId;
};

const ensureDbSqlUser = async ({ tiendaId, nombre, email, telefono, rol }) => {
  const existing = await getFirstRow(
    'SELECT * FROM Usuarios WHERE email = ? LIMIT 1',
    [email]
  );

  if (existing) {
    console.log(`Usuario reutilizado: ${email}`);
    return existing;
  }

  const passwordHash = await hashPassword(demoPassword);
  const [result] = await pool.query(
    `INSERT INTO Usuarios (id_tienda, nombre, email, telefono, password_hash, rol, estado)
     VALUES (?, ?, ?, ?, ?, ?, 'ACTIVO')`,
    [tiendaId, nombre, email, telefono, passwordHash, rol]
  );

  console.log(`Usuario creado: ${email}`);
  return {
    id_usuario: result.insertId,
    id_tienda: tiendaId,
    nombre,
    email,
    telefono,
    rol,
    estado: 'ACTIVO'
  };
};

const ensureDbSqlAdmin = async ({ userId, nivel_acceso, permisos }) => {
  const existing = await getFirstRow(
    'SELECT id_admin FROM Administrador WHERE id_usuario = ? LIMIT 1',
    [userId]
  );

  if (existing) {
    console.log(`Administrador reutilizado para usuario #${userId}`);
    return existing.id_admin;
  }

  const [result] = await pool.query(
    `INSERT INTO Administrador (id_usuario, id_admin_padre, nivel_acceso, permisos)
     VALUES (?, NULL, ?, ?)`,
    [userId, nivel_acceso, JSON.stringify(permisos)]
  );

  console.log(`Administrador creado para usuario #${userId}`);
  return result.insertId;
};

const ensureDbSqlCategory = async ({ tiendaId, nombre, tipo }) => {
  const existing = await getFirstRow(
    'SELECT id_categoria FROM Categorias WHERE id_tienda = ? AND nombre = ? AND tipo = ? LIMIT 1',
    [tiendaId, nombre, tipo]
  );

  if (existing) {
    console.log(`Categoria reutilizada: ${nombre} (${tipo})`);
    return existing.id_categoria;
  }

  const [result] = await pool.query(
    `INSERT INTO Categorias (id_tienda, nombre, tipo, estado)
     VALUES (?, ?, ?, 'ACTIVO')`,
    [tiendaId, nombre, tipo]
  );

  console.log(`Categoria creada: ${nombre} (${tipo})`);
  return result.insertId;
};

const ensureDbSqlProveedor = async ({ tiendaId, nombre_empresa, correo, telefono, direccion_texto, tiempo_entrega_horas }) => {
  const existing = await getFirstRow(
    'SELECT id_proveedor FROM Proveedores WHERE id_tienda = ? AND correo = ? LIMIT 1',
    [tiendaId, correo]
  );

  if (existing) {
    console.log(`Proveedor reutilizado: ${correo}`);
    return existing.id_proveedor;
  }

  const [result] = await pool.query(
    `INSERT INTO Proveedores
       (id_tienda, nombre_empresa, correo, telefono, direccion_texto, latitud, longitud, tiempo_entrega_horas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tiendaId,
      nombre_empresa,
      correo,
      telefono,
      direccion_texto,
      19.432608,
      -99.133209,
      tiempo_entrega_horas
    ]
  );

  console.log(`Proveedor creado: ${correo}`);
  return result.insertId;
};

const linkDbSqlProveedorCategoria = async (proveedorId, categoriaId) => {
  await pool.query(
    `INSERT IGNORE INTO Proveedor_Categoria (id_proveedor, id_categoria)
     VALUES (?, ?)`,
    [proveedorId, categoriaId]
  );
};

const ensureDbSqlProduct = async ({ tiendaId, proveedorId, categoriaId, codigo_barras, nombre, descripcion, precio_compra, precio_venta, cantidad, stock_minimo }) => {
  const existing = await getFirstRow(
    'SELECT id_producto FROM Productos WHERE codigo_barras = ? LIMIT 1',
    [codigo_barras]
  );

  if (existing) {
    await pool.query(
      `UPDATE Productos
       SET cantidad = GREATEST(cantidad, ?),
           id_proveedor = ?,
           descripcion = ?,
           precio_compra = ?,
           precio_venta = ?,
           stock_minimo = ?
       WHERE id_producto = ?`,
      [cantidad, proveedorId, descripcion, precio_compra, precio_venta, stock_minimo, existing.id_producto]
    );
    await pool.query(
      `INSERT IGNORE INTO Producto_Categoria (id_producto, id_categoria)
       VALUES (?, ?)`,
      [existing.id_producto, categoriaId]
    );
    console.log(`Producto reutilizado y abastecido: ${nombre}`);
    return existing.id_producto;
  }

  const [result] = await pool.query(
    `INSERT INTO Productos
       (id_tienda, id_proveedor, codigo_barras, nombre, descripcion, precio_compra, precio_venta, cantidad, stock_minimo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tiendaId, proveedorId, codigo_barras, nombre, descripcion, precio_compra, precio_venta, cantidad, stock_minimo]
  );

  await pool.query(
    `INSERT INTO Producto_Categoria (id_producto, id_categoria)
     VALUES (?, ?)`,
    [result.insertId, categoriaId]
  );

  console.log(`Producto creado: ${nombre}`);
  return result.insertId;
};

const getDbSqlProduct = async (productoId) => {
  const product = await getFirstRow(
    'SELECT id_producto, precio_venta, cantidad FROM Productos WHERE id_producto = ? LIMIT 1',
    [productoId]
  );

  if (!product) {
    throw new Error(`Producto no encontrado: ${productoId}`);
  }

  return product;
};

const ensureDbSqlSale = async ({ tiendaId, userId, uuid_transaccion, detalles }) => {
  const existing = await getFirstRow(
    'SELECT id_venta FROM Venta WHERE uuid_transaccion = ? LIMIT 1',
    [uuid_transaccion]
  );

  if (existing) {
    console.log(`Venta reutilizada: ${uuid_transaccion}`);
    return existing.id_venta;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let total = 0;
    const calculatedDetails = [];

    for (const detalle of detalles) {
      const [productRows] = await connection.query(
        'SELECT id_producto, precio_venta, cantidad FROM Productos WHERE id_producto = ? AND id_tienda = ? FOR UPDATE',
        [detalle.id_producto, tiendaId]
      );
      const product = productRows[0];

      if (!product || product.cantidad < detalle.cantidad) {
        throw new Error(`Stock insuficiente o producto invalido: ${detalle.id_producto}`);
      }

      const precio = Number(product.precio_venta);
      total += precio * detalle.cantidad;
      calculatedDetails.push({
        id_producto: detalle.id_producto,
        cantidad: detalle.cantidad,
        precio_unitario_venta: precio
      });
    }

    const [saleResult] = await connection.query(
      `INSERT INTO Venta (id_tienda, id_usuario, id_cliente, uuid_transaccion, total, estado)
       VALUES (?, ?, NULL, ?, ?, 'COMPLETADA')`,
      [tiendaId, userId, uuid_transaccion, total]
    );

    for (const detalle of calculatedDetails) {
      await connection.query(
        `INSERT INTO Detalle_Venta (id_venta, id_producto, cantidad, precio_unitario_venta)
         VALUES (?, ?, ?, ?)`,
        [saleResult.insertId, detalle.id_producto, detalle.cantidad, detalle.precio_unitario_venta]
      );

      await connection.query(
        `UPDATE Productos
         SET cantidad = cantidad - ?
         WHERE id_producto = ? AND id_tienda = ?`,
        [detalle.cantidad, detalle.id_producto, tiendaId]
      );

      await connection.query(
        `INSERT INTO Historial_Inventario
           (id_producto, id_tienda, id_usuario_responsable, tipo_movimiento, cantidad, observaciones)
         VALUES (?, ?, ?, 'VENTA', ?, ?)`,
        [
          detalle.id_producto,
          tiendaId,
          userId,
          detalle.cantidad,
          `Venta demo ${uuid_transaccion}`
        ]
      );
    }

    await connection.commit();
    console.log(`Venta creada: ${uuid_transaccion} total ${total}`);
    return saleResult.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const ensureDbSqlEvaluation = async ({ evaluadorId, evaluadoId, calificacion, comentarios }) => {
  const existing = await getFirstRow(
    `SELECT id_evaluacion
     FROM Evaluaciones
     WHERE id_usuario_evaluador = ?
       AND id_usuario_evaluado = ?
       AND comentarios = ?
     LIMIT 1`,
    [evaluadorId, evaluadoId, comentarios]
  );

  if (existing) {
    await pool.query(
      "UPDATE Evaluaciones SET estado = 'APROBADA' WHERE id_evaluacion = ?",
      [existing.id_evaluacion]
    );
    console.log(`Evaluacion reutilizada: ${comentarios.slice(0, 40)}...`);
    return existing.id_evaluacion;
  }

  const [result] = await pool.query(
    `INSERT INTO Evaluaciones
       (id_usuario_evaluador, id_usuario_evaluado, calificacion, comentarios, estado)
     VALUES (?, ?, ?, ?, 'APROBADA')`,
    [evaluadorId, evaluadoId, calificacion, comentarios]
  );

  console.log(`Evaluacion creada: ${comentarios.slice(0, 40)}...`);
  return result.insertId;
};

const seedDatabaseSqlSchema = async () => {
  logStep('Creando datos para estructura database.sql');
  const tiendaId = await ensureDbSqlTienda();

  const admin = await ensureDbSqlUser({
    tiendaId,
    nombre: 'Andrea Martinez',
    email: 'admin.demo@scynara.com',
    telefono: '5510000001',
    rol: 'ADMINISTRADOR'
  });

  const empleado = await ensureDbSqlUser({
    tiendaId,
    nombre: 'Carlos Lopez',
    email: 'cajero.demo@scynara.com',
    telefono: '5510000002',
    rol: 'EMPLEADO'
  });

  await ensureDbSqlAdmin({
    userId: admin.id_usuario,
    nivel_acceso: 'TOTAL',
    permisos: {
      usuarios: true,
      inventario: true,
      ventas: true,
      reportes: true
    }
  });

  logStep('Creando categorias multi-tenant');
  const catAbarrotes = await ensureDbSqlCategory({ tiendaId, nombre: 'Abarrotes', tipo: 'PRODUCTO' });
  const catBebidas = await ensureDbSqlCategory({ tiendaId, nombre: 'Bebidas', tipo: 'PRODUCTO' });
  const catLimpieza = await ensureDbSqlCategory({ tiendaId, nombre: 'Limpieza', tipo: 'PRODUCTO' });
  const catProveedorLocal = await ensureDbSqlCategory({ tiendaId, nombre: 'Proveedor local', tipo: 'PROVEEDOR' });
  const catDistribuidor = await ensureDbSqlCategory({ tiendaId, nombre: 'Distribuidor', tipo: 'PROVEEDOR' });

  logStep('Creando proveedores y relaciones de categorias');
  const proveedorCentral = await ensureDbSqlProveedor({
    tiendaId,
    nombre_empresa: 'Distribuidora La Central',
    correo: 'ventas.central@proveedores-demo.com',
    telefono: '5551112233',
    direccion_texto: 'Bodega 45, Mercado Central',
    tiempo_entrega_horas: 48
  });
  await linkDbSqlProveedorCategoria(proveedorCentral, catDistribuidor);

  const proveedorValle = await ensureDbSqlProveedor({
    tiendaId,
    nombre_empresa: 'Bebidas del Valle',
    correo: 'contacto.valle@proveedores-demo.com',
    telefono: '5552223344',
    direccion_texto: 'Parque Industrial Norte 10',
    tiempo_entrega_horas: 24
  });
  await linkDbSqlProveedorCategoria(proveedorValle, catProveedorLocal);

  logStep('Creando productos y relaciones de categorias');
  const arroz = await ensureDbSqlProduct({
    tiendaId,
    proveedorId: proveedorCentral,
    categoriaId: catAbarrotes,
    codigo_barras: '7501000000011',
    nombre: 'Arroz super extra 1kg',
    descripcion: 'Bolsa de arroz blanco de un kilogramo',
    precio_compra: 15,
    precio_venta: 22,
    cantidad: 120,
    stock_minimo: 10
  });

  const cafe = await ensureDbSqlProduct({
    tiendaId,
    proveedorId: proveedorCentral,
    categoriaId: catAbarrotes,
    codigo_barras: '7501000000028',
    nombre: 'Cafe molido premium 500g',
    descripcion: 'Cafe tostado y molido para venta al publico',
    precio_compra: 62,
    precio_venta: 85,
    cantidad: 80,
    stock_minimo: 8
  });

  const agua = await ensureDbSqlProduct({
    tiendaId,
    proveedorId: proveedorValle,
    categoriaId: catBebidas,
    codigo_barras: '7501000000035',
    nombre: 'Agua natural 1L',
    descripcion: 'Botella de agua natural de un litro',
    precio_compra: 7,
    precio_venta: 12,
    cantidad: 200,
    stock_minimo: 24
  });

  const detergente = await ensureDbSqlProduct({
    tiendaId,
    proveedorId: proveedorCentral,
    categoriaId: catLimpieza,
    codigo_barras: '7501000000042',
    nombre: 'Detergente liquido 2L',
    descripcion: 'Detergente liquido multiusos',
    precio_compra: 70,
    precio_venta: 95,
    cantidad: 60,
    stock_minimo: 6
  });

  await getDbSqlProduct(arroz);
  await getDbSqlProduct(cafe);
  await getDbSqlProduct(agua);
  await getDbSqlProduct(detergente);

  logStep('Creando ventas, detalles e historial de inventario');
  await ensureDbSqlSale({
    tiendaId,
    userId: empleado.id_usuario,
    uuid_transaccion: '11111111-1111-4111-8111-111111111111',
    detalles: [
      { id_producto: arroz, cantidad: 2 },
      { id_producto: agua, cantidad: 4 }
    ]
  });

  await ensureDbSqlSale({
    tiendaId,
    userId: empleado.id_usuario,
    uuid_transaccion: '22222222-2222-4222-8222-222222222222',
    detalles: [
      { id_producto: cafe, cantidad: 1 },
      { id_producto: detergente, cantidad: 1 }
    ]
  });

  logStep('Creando evaluaciones operativas');
  await ensureDbSqlEvaluation({
    evaluadorId: admin.id_usuario,
    evaluadoId: empleado.id_usuario,
    calificacion: 5,
    comentarios: 'El cajero demo mantiene el flujo de ventas y stock correctamente.'
  });

  await ensureDbSqlEvaluation({
    evaluadorId: empleado.id_usuario,
    evaluadoId: admin.id_usuario,
    calificacion: 5,
    comentarios: 'La administracion demo permite revisar inventario y ventas con claridad.'
  });

  return [
    { tipo: 'Admin', email: 'admin.demo@scynara.com', password: demoPassword },
    { tipo: 'Empleado', email: 'cajero.demo@scynara.com', password: demoPassword }
  ];
};

const main = async () => {
  logStep('Validando conexion con MySQL');
  await pool.query('SELECT 1');

  const schema = await detectSchema();
  console.log(`[seed] Esquema detectado: ${schema}`);

  const credentials = schema === 'database_sql'
    ? await seedDatabaseSqlSchema()
    : await seedAppSchema();

  logStep('Datos demo listos');
  console.table(credentials);
};

main()
  .catch((error) => {
    console.error('\n[seed] Error al crear datos demo');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
