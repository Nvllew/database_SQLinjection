import express from 'express';
import { register, login, getMe, getUsers, update, remove } from '../controllers/auth.controller.js';
import { verifyToken } from "../middlewares/auth.middleware.js";
import { preventGuestWrites, requireAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();



router.post('/register', register);
router.post('/login', login);


router.get('/me', verifyToken, getMe);

router.get('/users', verifyToken, requireAdmin, getUsers);
router.post('/users', verifyToken, preventGuestWrites, requireAdmin, register);
router.put('/users/:id', verifyToken, preventGuestWrites, update);
router.delete('/users/:id', verifyToken, preventGuestWrites, requireAdmin, remove);

export default router;
