import {
  getClientesList,
  getClienteDetails,
  addCliente,
  modifyCliente,
  removeCliente
} from '../services/customers.service.js';


export const getAllClientes = async (req, res, next) => {
  try {
    
    const tiendaId = req.user.id_tienda; 
    
    const clientes = await getClientesList(tiendaId);
    res.status(200).json(clientes);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Error en getAllClientes:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};


export const getCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tiendaId = req.user.id_tienda;

    const cliente = await getClienteDetails(id, tiendaId);
    res.status(200).json(cliente);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Error en getCliente:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};


export const createCliente = async (req, res, next) => {
  try {
    const tiendaId = req.user.id_tienda;
    
    
    const data = { ...req.body, id_tienda: tiendaId };
    
    const newCliente = await addCliente(data);
    res.status(201).json(newCliente);
  } catch (error) {
    
    if (error.status) {
      return res.status(error.status).json({
        message: error.message,
        errors: error.errors 
      });
    }
    console.error("Error en createCliente:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};


export const updateCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tiendaId = req.user.id_tienda;

    const result = await modifyCliente(id, tiendaId, req.body);
    res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        message: error.message,
        errors: error.errors 
      });
    }
    console.error("Error en updateCliente:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};


export const deleteCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tiendaId = req.user.id_tienda;

    const result = await removeCliente(id, tiendaId);
    res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Error en deleteCliente:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};