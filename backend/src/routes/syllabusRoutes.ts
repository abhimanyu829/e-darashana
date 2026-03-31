import express from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import { uploadSyllabus, parseSyllabus } from '../controllers/syllabusController';

const router = express.Router();

router.post('/upload', verifyToken, uploadSyllabus);
router.post('/parse/:id', verifyToken, parseSyllabus);

export default router;
