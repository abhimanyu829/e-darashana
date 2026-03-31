import express from 'express';
import { getActivityLogs } from '../controllers/activityController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', verifyToken, getActivityLogs);

export default router;
