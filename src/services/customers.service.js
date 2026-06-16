import { createClienteSchema, updateClienteSchema } from '../schemas/customers.schema.js';
import {
  findAllClientes,
  findClienteById,
  checkDuplicadosCliente,
  createCliente,
  updateClienteById,
  deleteClienteById
} from '../models/customers.model.js';


export const getClientesList = async (tiendaId) => {
  return await findAllClientes(tiendaId);
};


export const getClienteDetails = async (id, tiendaId) => {
  const cliente = await findClienteById(id, tiendaId);
  if (!cliente) {
    const err = new Error('Cliente no encontrado o no pertenece a tu sucursal');
    err.status = 404;
    throw err;
  }
  return cliente;
};


export const addCliente = async (data) => {
  
  const validation = createClienteSchema.safeParse(data);
  if (!validation.success) {
    const err = new Error('Revisa los datos enviados');
    err.status = 400;
    
    
    const fieldErrors = {};
    validation.error.issues.forEach(issue => {
      fieldErrors[issue.path[0]] = issue.message;
    });
    err.errors = fieldErrors; 
    throw err;
  }

  
  const duplicados = await checkDuplicadosCliente(
    validation.data.email, 
    validation.data.telefono, 
    validation.data.RFC,
    validation.data.id_tienda
  );
  
  if (duplicados) {
    const err = new Error('Algunos datos ya están registrados');
    err.status = 400;
    err.errors = duplicados; 
    throw err;
  }

  
  const clienteId = await createCliente(validation.data);
  return { id_cliente: clienteId, ...validation.data };
};


export const modifyCliente = async (id, tiendaId, data) => {
  
  const datosCompletos = { ...data, id_tienda: tiendaId };
  
  
  const validation = updateClienteSchema.safeParse(datosCompletos);
  if (!validation.success) {
    const err = new Error('Revisa los datos enviados');
    err.status = 400;
    
    const fieldErrors = {};
    validation.error.issues.forEach(issue => {
      fieldErrors[issue.path[0]] = issue.message;
    });
    err.errors = fieldErrors;
    throw err;
  }

  
  const duplicados = await checkDuplicadosCliente(
    validation.data.email, 
    validation.data.telefono, 
    validation.data.RFC,
    tiendaId, 
    id
  );
  
  if (duplicados) {
    const err = new Error('Ya existe otro registro con esos datos');
    err.status = 400;
    err.errors = duplicados;
    throw err;
  }

  
  const success = await updateClienteById(id, tiendaId, validation.data);
  if (!success) {
    const err = new Error('No se pudo actualizar el cliente (no existe o no tienes permisos)');
    err.status = 404;
    throw err;
  }
  
  return { message: 'Cliente actualizado con éxito' };
};


export const removeCliente = async (id, tiendaId) => {
  const success = await deleteClienteById(id, tiendaId);
  if (!success) {
    const err = new Error('No se pudo eliminar el cliente (no existe o no tienes permisos)');
    err.status = 404;
    throw err;
  }
  return { message: 'Cliente eliminado con éxito' };
};