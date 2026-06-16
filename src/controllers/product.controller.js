import * as ProductService from '../services/product.service.js';

export const getAll = async (req, res, next) => {
  try {
    
    const tiendaId = req.user.id_tienda;
    const products = await ProductService.getProductsList(tiendaId);
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tiendaId = req.user.id_tienda;

    
    const product = await ProductService.getProductDetails(id, tiendaId);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    
    const productData = {
      ...req.body,
      id_tienda: req.user.id_tienda
    };

    const newProduct = await ProductService.addProduct(productData);
    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tiendaId = req.user.id_tienda;

    
    const result = await ProductService.modifyProduct(id, tiendaId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tiendaId = req.user.id_tienda;

    
    const result = await ProductService.removeProduct(id, tiendaId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};