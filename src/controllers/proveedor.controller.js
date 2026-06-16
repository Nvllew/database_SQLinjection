import * as ProveedorService from '../services/proveedor.service.js';


export const getCategorias = async (req, res, next) => {
  try {
    
    const categorias = await ProveedorService.getCategoriasList();
    res.status(200).json(categorias);
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const tiendaId = req.user.id_tienda;
    const proveedores = await ProveedorService.getProveedoresList(tiendaId);
    res.status(200).json(proveedores);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tiendaId = req.user.id_tienda;
    const proveedor = await ProveedorService.getProveedorDetails(id, tiendaId);
    res.status(200).json(proveedor);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    
    const dataConTienda = { ...req.body, id_tienda: req.user.id_tienda };
    const newProveedor = await ProveedorService.addProveedor(dataConTienda);
    res.status(201).json(newProveedor);
  } catch (error) {
    next(error); 
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tiendaId = req.user.id_tienda;
    const result = await ProveedorService.modifyProveedor(id, tiendaId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tiendaId = req.user.id_tienda;
    const result = await ProveedorService.removeProveedor(id, tiendaId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};