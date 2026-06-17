import { Router } from 'express';
import { 
  getCategorias, 
  getAll, 
  getById, 
  create, 
  update, 
  remove 
} from '../controllers/proveedor.controller.js';

import { verifyToken } from '../middlewares/auth.middleware.js';
import { validateParamId } from '../middlewares/validateParamId.middleware.js';

const router = Router();



router.use(verifyToken);





router.get('/categorias', getCategorias); 

router.get('/', getAll);
router.get('/:id', validateParamId(), getById);
router.post('/', create);
router.put('/:id', validateParamId(), update);
router.delete('/:id', validateParamId(), remove);

export default router;
