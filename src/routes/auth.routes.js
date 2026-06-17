import express from 'express';
import { register, login, getMe, getUsers, update, remove } from '../controllers/auth.controller.js';
import { verifyToken } from "../middlewares/auth.middleware.js";
import { preventGuestWrites, requireAdmin } from '../middlewares/role.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import { validateParamId } from '../middlewares/validateParamId.middleware.js';

const router = express.Router();



router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);


router.get('/me', verifyToken, getMe);

router.get('/users', verifyToken, requireAdmin, getUsers);
router.post('/users', verifyToken, preventGuestWrites, requireAdmin, register);
router.put('/users/:id', verifyToken, preventGuestWrites, validateParamId(), update);
router.delete('/users/:id', verifyToken, preventGuestWrites, requireAdmin, validateParamId(), remove);

export default router;
