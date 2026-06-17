import express from 'express';
import {
  getAllClientes,
  getCliente,
  createCliente,
  updateCliente,
  deleteCliente
} from '../controllers/customers.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { validateParamId } from '../middlewares/validateParamId.middleware.js';

const router = express.Router();

router.use(verifyToken);


router.get('/', getAllClientes);
router.get('/:id', validateParamId(), getCliente);
router.post('/', createCliente);
router.put('/:id', validateParamId(), updateCliente);
router.delete('/:id', validateParamId(), deleteCliente);

export default router;
