import { Router } from 'express';
import { 
  getAll, 
  getById, 
  create,
  cancel 
} from '../controllers/venta.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();


router.use(verifyToken);


router.get('/', getAll);                 
router.get('/:id', getById);            
router.post('/', create);                
router.patch('/:id/cancel', cancel);     

export default router;