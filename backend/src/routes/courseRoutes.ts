import express from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import { createCourse, deleteCourse, getCourses, getTopics } from '../controllers/courseController';

const router = express.Router();

router.get('/', verifyToken, getCourses);
router.post('/', verifyToken, createCourse);
router.delete('/:id', verifyToken, deleteCourse);
router.get('/:id/topics', verifyToken, getTopics);

export default router;
