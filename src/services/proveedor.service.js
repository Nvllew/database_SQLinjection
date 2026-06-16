import { createProveedorSchema, updateProveedorSchema } from '../schemas/proveedor.schema.js';
import * as ProveedorModel from '../models/proveedor.model.js';


export const getCategoriasList = async () => {
  return await ProveedorModel.findAllCategorias();
};


export const getProveedoresList = async (tiendaId) => {
  return await ProveedorModel.findAllProveedores(tiendaId);
};


export const getProveedorDetails = async (id, tiendaId) => {
  const proveedor = await ProveedorModel.findProveedorById(id, tiendaId);
  if (!proveedor) {
    const err = new Error('Proveedor no encontrado o no pertenece a tu sucursal');
    err.status = 404;
    throw err;
  }
  return proveedor;
};


export const addProveedor = async (data) => {
  const validation = createProveedorSchema.safeParse(data);
  
  if (!validation.success) {
    const err = new Error("Error de validación");
    err.status = 400;
    err.details = validation.error.flatten().fieldErrors;
    throw err;
  }
  
  const { correo, telefono, id_tienda } = validation.data;

  
  if (correo || telefono) {
    const duplicates = await ProveedorModel.checkDuplicadosGlobales(correo, telefono, id_tienda);
    
    if (duplicates) {
      const err = new Error("Datos duplicados");
      err.status = 400;
      err.details = duplicates; 
      throw err;
    }
  }
  
  const insertId = await ProveedorModel.createProveedor(validation.data);
  
  return { 
    message: 'Proveedor creado con éxito',
    id_proveedor: insertId
  };
};


export const modifyProveedor = async (id, tiendaId, data) => {
  
  const datosCompletos = { ...data, id_tienda: tiendaId };

  const validation = updateProveedorSchema.safeParse(datosCompletos);
  
  if (!validation.success) {
    const err = new Error("Error de validación");
    err.status = 400;
    err.details = validation.error.flatten().fieldErrors;
    throw err;
  }
  
  const { correo, telefono } = validation.data;

  
  if (correo || telefono) {
    const duplicates = await ProveedorModel.checkDuplicadosGlobales(correo, telefono, tiendaId, id);
    
    if (duplicates) {
      const err = new Error("Datos duplicados");
      err.status = 400;
      err.details = duplicates;
      throw err;
    }
  }

  const success = await ProveedorModel.updateProveedorById(id, tiendaId, validation.data);
  if (!success) {
    const err = new Error('No se pudo actualizar el proveedor. Es posible que no exista o no pertenezca a esta tienda.');
    err.status = 404;
    throw err;
  }
  
  return { message: 'Proveedor actualizado con éxito' };
};


export const removeProveedor = async (id, tiendaId) => {
  const success = await ProveedorModel.deleteProveedorById(id, tiendaId);
  if (!success) {
    const err = new Error('No se pudo modificar el proveedor');
    err.status = 404;
    throw err;
  }
  return { message: 'Proveedor eliminado con éxito' };
};