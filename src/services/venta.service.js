import { createVentaSchema } from '../schemas/venta.schema.js';
import * as VentaModel from '../models/venta.model.js';


export const getVentasList = async (tiendaId) => {
  return await VentaModel.findAllVentas(tiendaId);
};


export const getVentaDetails = async (id, tiendaId) => {
  const venta = await VentaModel.findVentaCompletaById(id, tiendaId);

  if (!venta) {
    const err = new Error('Venta no encontrada o no pertenece a tu sucursal');
    err.status = 404;
    throw err;
  }

  return venta;
};


export const addVenta = async (data) => {
  
  const validation = createVentaSchema.safeParse(data);

  if (!validation.success) {
    const err = new Error('Revisa los datos de la venta');
    err.status = 400;
    
    
    const fieldErrors = {};
    validation.error.issues.forEach(issue => {
      fieldErrors[issue.path.join('.')] = issue.message;
    });
    
    err.errors = fieldErrors;
    throw err;
  }

  
  const venta = await VentaModel.createVentaTransaccion(validation.data);

  
  return {
    message: 'Venta procesada correctamente',
    id_venta: venta.idVenta,
    total: venta.total
  };
};


export const cancelVenta = async (id, tiendaId) => {
  
  
  await VentaModel.cancelVentaTransaccion(id, tiendaId);
  
  return { message: 'Venta cancelada y stock restaurado con éxito' };
};
