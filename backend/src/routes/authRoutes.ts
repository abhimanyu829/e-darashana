import express from 'express';
import jwt from 'jsonwebtoken';
import { oauth2Client } from '../config/googleOAuth';
import { JWT_SECRET, JWT_EXPIRE } from '../config/jwtConfig';

const router = express.Router();

router.post('/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await oauth2Client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const user = {
      uid: payload.sub,
      email: payload.email,
      displayName: payload.name || '',
      photoURL: payload.picture
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRE as any });

    res.json({ token, user });
  } catch {
    res.status(400).json({ message: 'Authentication failed' });
  }
});

router.get('/auth/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;