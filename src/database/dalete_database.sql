-- -----------------------------------------------------------------------------
-- SCRIPT PARA ELIMINAR TABLAS: SCYNARA ERP/POS
-- Motor: MySQL 8.0+
-- -----------------------------------------------------------------------------

USE scynara;

-- Deshabilitar la revisión de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas dependientes (Hojas)
DROP TABLE IF EXISTS Detalle_Venta;
DROP TABLE IF EXISTS Historial_Inventario;
DROP TABLE IF EXISTS Venta;
DROP TABLE IF EXISTS Producto_Categoria;
DROP TABLE IF EXISTS Proveedor_Categoria;
DROP TABLE IF EXISTS Evaluaciones;
DROP TABLE IF EXISTS Administrador;

-- Eliminar tablas intermedias
DROP TABLE IF EXISTS Productos;
DROP TABLE IF EXISTS Proveedores;
DROP TABLE IF EXISTS Categorias;
DROP TABLE IF EXISTS Usuarios;

-- Eliminar tabla principal (Raíz)
DROP TABLE IF EXISTS Tiendas;

-- Volver a habilitar la revisión de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;
