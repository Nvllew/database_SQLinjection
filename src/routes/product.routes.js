import express from 'express';
import {
  getAll,
  getById,
  create,
  update,
  remove
} from '../controllers/product.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { validateParamId } from '../middlewares/validateParamId.middleware.js';

const router = express.Router();


router.use(verifyToken);


router.get('/', getAll);
router.get('/:id', validateParamId(), getById);
router.post('/', create);
router.put('/:id', validateParamId(), update);
router.delete('/:id', validateParamId(), remove);

export default router;
