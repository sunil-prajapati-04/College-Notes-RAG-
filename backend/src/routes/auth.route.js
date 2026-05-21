import express from 'express';
import { signup, login, myProfile, logout } from '../controllers/auth.controller.js';
import authMiddleware from '../middelware/auth.middelware.js';

const router = express.Router();

router.post('/signup',signup);
router.post('/login',login);
router.get('/myProfile',authMiddleware,myProfile);
router.post('/logout',authMiddleware,logout);

export default router;
