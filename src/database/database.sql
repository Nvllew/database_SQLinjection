-- -----------------------------------------------------------------------------
-- BASE DE DATOS: SCYNARA ERP/POS
-- Motor: MySQL 8.0+
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS scynara;
USE scynara;

-- 2. Creación de Tablas Core

CREATE TABLE Tiendas (
    id_tienda INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    galeria_fotos JSON DEFAULT NULL, -- Arreglo de URLs de imágenes
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    foto_perfil VARCHAR(255) DEFAULT NULL, -- URL de la imagen en la nube
    rol ENUM('ADMINISTRADOR', 'EMPLEADO') NOT NULL,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_tienda) REFERENCES Tiendas(id_tienda) ON DELETE CASCADE
);

CREATE TABLE Administrador (
    id_admin INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_admin_padre INT DEFAULT NULL,
    nivel_acceso ENUM('TOTAL', 'SUCURSAL', 'AUDITOR') NOT NULL,
    permisos JSON,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_admin_padre) REFERENCES Administrador(id_admin) ON DELETE SET NULL
);

-- 3. Entidades Operativas

CREATE TABLE Proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    nombre_empresa VARCHAR(150) NOT NULL,
    correo VARCHAR(100),
    telefono VARCHAR(20),
    direccion_texto VARCHAR(255) DEFAULT NULL,
    latitud DECIMAL(10, 8) DEFAULT NULL,
    longitud DECIMAL(11, 8) DEFAULT NULL,
    tiempo_entrega_horas INT DEFAULT NULL,
    FOREIGN KEY (id_tienda) REFERENCES Tiendas(id_tienda) ON DELETE CASCADE
);

CREATE TABLE Productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    id_proveedor INT DEFAULT NULL,
    codigo_barras VARCHAR(50) UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio_compra DECIMAL(10, 2) NOT NULL,
    precio_venta DECIMAL(10, 2) NOT NULL,
    cantidad INT DEFAULT 0,
    stock_minimo INT DEFAULT 5,
    FOREIGN KEY (id_tienda) REFERENCES Tiendas(id_tienda) ON DELETE CASCADE,
    FOREIGN KEY (id_proveedor) REFERENCES Proveedores(id_proveedor) ON DELETE SET NULL
);

-- 4. Sistema de Categorías Dinámicas (Multi-Tenant)
CREATE TABLE Categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('PRODUCTO', 'PROVEEDOR', 'CLIENTE', 'GASTO') NOT NULL,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_tienda) REFERENCES Tiendas(id_tienda) ON DELETE CASCADE
);

CREATE TABLE Proveedor_Categoria (
    id_proveedor INT NOT NULL,
    id_categoria INT NOT NULL,
    PRIMARY KEY (id_proveedor, id_categoria),
    FOREIGN KEY (id_proveedor) REFERENCES Proveedores(id_proveedor) ON DELETE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria) ON DELETE CASCADE
);

CREATE TABLE Producto_Categoria (
    id_producto INT NOT NULL,
    id_categoria INT NOT NULL,
    PRIMARY KEY (id_producto, id_categoria),
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria) ON DELETE CASCADE
);

-- 5. Ventas y Trazabilidad

CREATE TABLE Venta (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT NOT NULL,
    id_usuario INT NOT NULL,
    id_cliente INT DEFAULT NULL,
    uuid_transaccion VARCHAR(36) UNIQUE NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    estado ENUM('COMPLETADA', 'CANCELADA') DEFAULT 'COMPLETADA',
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_tienda) REFERENCES Tiendas(id_tienda) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

CREATE TABLE Detalle_Venta (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario_venta DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (cantidad * precio_unitario_venta) STORED,
    FOREIGN KEY (id_venta) REFERENCES Venta(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
);

CREATE TABLE Historial_Inventario (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    id_tienda INT NOT NULL,
    id_usuario_responsable INT NOT NULL,
    tipo_movimiento ENUM('COMPRA', 'VENTA', 'AJUSTE', 'DEVOLUCION', 'MERMA') NOT NULL,
    cantidad INT NOT NULL,
    observaciones TEXT,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_tienda) REFERENCES Tiendas(id_tienda) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_responsable) REFERENCES Usuarios(id_usuario)
);

-- 8. RETROALIMENTACIÓN OPERATIVA
CREATE TABLE Evaluaciones (
    id_evaluacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_evaluador INT NOT NULL,
    id_usuario_evaluado INT NOT NULL,
    calificacion INT NOT NULL,
    comentarios TEXT,
    estado ENUM('PENDIENTE', 'APROBADA', 'RECHAZADA') DEFAULT 'PENDIENTE',
    fecha_evaluacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_calificacion_rango CHECK (calificacion BETWEEN 1 AND 5),
    FOREIGN KEY (id_usuario_evaluador) REFERENCES Usuarios(id_usuario) ON DELETE RESTRICT,
    FOREIGN KEY (id_usuario_evaluado) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE
);