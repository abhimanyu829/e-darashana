import express from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import { updateTaskStatus, getTodayTasks } from '../controllers/taskController';

const router = express.Router();

router.get('/today', verifyToken, getTodayTasks);
router.patch('/status', verifyToken, updateTaskStatus);

export default router;
