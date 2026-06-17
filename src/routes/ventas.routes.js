import { Router } from 'express';
import { 
  getAll, 
  getById, 
  create,
  cancel 
} from '../controllers/venta.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { validateParamId } from '../middlewares/validateParamId.middleware.js';

const router = Router();


router.use(verifyToken);


router.get('/', getAll);
router.get('/:id', validateParamId(), getById);
router.post('/', create);
router.patch('/:id/cancel', validateParamId(), cancel);

export default router;
