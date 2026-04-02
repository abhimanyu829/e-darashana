import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JWT_SECRET } from '../config/jwtConfig';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  try {
    const decodedToken: any = jwt.verify(token, JWT_SECRET);
    (req as any).userId = decodedToken.uid;
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error('TOKEN ERROR:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};