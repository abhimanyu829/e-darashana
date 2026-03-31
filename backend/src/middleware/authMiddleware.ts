import admin from '../config/firebaseAdmin';
import { Request, Response, NextFunction } from 'express';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).userId = decodedToken.uid;
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error('TOKEN ERROR:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};
