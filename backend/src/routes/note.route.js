import express from 'express';
import {uploadFile,queryFile} from '../controllers/note.controller.js';
import upload from '../middelware/upload.middelware.js';
import authMiddleware from '../middelware/auth.middelware.js';
const router = express.Router();

router.post('/upload', authMiddleware, upload.single('file'), uploadFile);
router.get('/getNote', authMiddleware, queryFile);

export default router;