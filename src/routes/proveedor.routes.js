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

const router = Router();



router.use(verifyToken);





router.get('/categorias', getCategorias); 

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;