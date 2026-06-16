import express from 'express';
import {
  getAllClientes,
  getCliente,
  createCliente,
  updateCliente,
  deleteCliente
} from '../controllers/customers.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);


router.get('/', getAllClientes);         
router.get('/:id', getCliente);          
router.post('/', createCliente);         
router.put('/:id', updateCliente);       
router.delete('/:id', deleteCliente);    

export default router;