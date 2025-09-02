// middleware/optionalAuth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyFirebase } from './verifyFirebase';

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // لا هيدر → نمرر مباشرة
    return next();
  }

  try {
    // حاول المصادقة
    await verifyFirebase(req, res, next as any);
  } catch (err: any) {
    console.warn('⚠️ optionalAuth: Firebase verify failed:', err.message);
    // تجاهل الخطأ واستمرّ كضيف
    return next();
  }
};