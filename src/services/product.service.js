import { createProductSchema, updateProductSchema } from '../schemas/product.schema.js';
import {
  findAllProducts,
  findProductById,
  createProduct,
  updateProductById,
  deleteProductById
} from '../models/product.model.js';


export const getProductsList = async (tiendaId) => {
  return await findAllProducts(tiendaId);
};


export const getProductDetails = async (id, tiendaId) => {
  const product = await findProductById(id, tiendaId);
  if (!product) {
    const err = new Error('Producto no encontrado o no pertenece a tu sucursal');
    err.status = 404;
    throw err;
  }
  return product;
};

export const addProduct = async (data) => {
  
  
  
  const validation = createProductSchema.safeParse(data);
  if (!validation.success) {
    const errorMessage = validation.error.issues?.[0]?.message || validation.error.errors?.[0]?.message || 'Datos de producto inválidos';
    const err = new Error(errorMessage);
    err.status = 400;
    throw err;
  }

  const productId = await createProduct(validation.data);
  return { id_producto: productId, ...validation.data };
};


export const modifyProduct = async (id, tiendaId, data) => {
  
  const validation = updateProductSchema.safeParse(data);
  if (!validation.success) {
    const errorMessage = validation.error.issues?.[0]?.message || validation.error.errors?.[0]?.message || 'Datos de producto inválidos';
    const err = new Error(errorMessage);
    err.status = 400;
    throw err;
  }

  const success = await updateProductById(id, tiendaId, validation.data);
  if (!success) {
    const err = new Error('No se pudo actualizar el producto (no existe o no tienes permisos)');
    err.status = 404;
    throw err;
  }
  return { message: 'Producto actualizado con éxito' };
};


export const removeProduct = async (id, tiendaId) => {
  const success = await deleteProductById(id, tiendaId);
  if (!success) {
    const err = new Error('No se pudo eliminar el producto (no existe o no tienes permisos)');
    err.status = 404;
    throw err;
  }
  return { message: 'Producto eliminado con éxito' };
};