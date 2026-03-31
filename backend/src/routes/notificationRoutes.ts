import express from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import { subscribe, unsubscribe, getVapidPublicKey } from '../controllers/notificationController';

const router = express.Router();

// Public: frontend needs this before login to configure SW
router.get('/vapid-public-key', getVapidPublicKey);

// Protected: requires Firebase auth token
router.post('/subscribe', verifyToken, subscribe);
router.delete('/unsubscribe', verifyToken, unsubscribe);

export default router;
