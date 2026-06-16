import * as VentaService from '../services/venta.service.js';

export const getAll = async (req, res, next) => {
  try {
    
    const tiendaId = req.user.id_tienda;
    const ventas = await VentaService.getVentasList(tiendaId);

    res.status(200).json(ventas);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tiendaId = req.user.id_tienda;

    
    const venta = await VentaService.getVentaDetails(id, tiendaId);

    res.status(200).json(venta);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    
    
    const ventaData = {
      ...req.body,
      id_tienda: req.user.id_tienda,
      id_usuario: req.user.sub 
    };

    const result = await VentaService.addVenta(ventaData);

    res.status(201).json(result);
  } catch (error) {
    
    next(error);
  }
};


export const cancel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tiendaId = req.user.id_tienda;

    
    const result = await VentaService.cancelVenta(id, tiendaId);

    res.status(200).json(result);
  } catch (error) {
    
    next(error);
  }
};