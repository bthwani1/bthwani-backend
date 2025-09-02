import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AdminPayload } from '../types/types'; // تعريف الواجهة الخاصة ببيانات الـ JWT

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

declare global {
  namespace Express {
    interface Request {
      user?: AdminPayload;
    }
  }
}

export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
     res.status(401).json({ message: 'Missing or invalid token' });
     return;
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AdminPayload;
    req.user = payload;
    next();
  } catch (err) {
     res.status(401).json({ message: 'Invalid or expired token' });
     return;
  }
}
