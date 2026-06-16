import { Router } from "express";
import { createEvaluation, getPublicEvaluations } from "../controllers/evaluations.controller.js";
import { verifyToken } from '../middlewares/auth.middleware.js'; 
import { preventGuestWrites } from '../middlewares/role.middleware.js';

const router = Router();


router.get("/publicas", getPublicEvaluations);



router.post("/", verifyToken, preventGuestWrites, createEvaluation); 

export default router;
