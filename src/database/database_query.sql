-- -----------------------------------------------------------------------------
-- SCRIPT DE CONSULTA GENERAL: SCYNARA ERP/POS
-- -----------------------------------------------------------------------------

USE scynara;

-- ==========================================
-- 1. Tablas Core (Estructura y Accesos)
-- ==========================================
SELECT * FROM Tiendas;
SELECT * FROM Usuarios;
SELECT * FROM Administrador;

-- ==========================================
-- 2. Entidades Operativas (Catálogos)
-- ==========================================
SELECT * FROM Proveedores;
SELECT * FROM Categoria;
SELECT * FROM Productos;

-- ==========================================
-- 3. Tablas Intermedias (Clasificación)
-- ==========================================
SELECT * FROM Proveedor_Categoria;
SELECT * FROM Producto_Categoria;

-- ==========================================
-- 4. Ventas y Trazabilidad Operativa
-- ==========================================
SELECT * FROM Venta;
SELECT * FROM Detalle_Venta;
SELECT * FROM Historial_Inventario;

-- ==========================================
-- 5. Retroalimentación
-- ==========================================
SELECT * FROM Evaluaciones;