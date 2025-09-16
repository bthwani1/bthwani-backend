// src/types/express/index.d.ts
import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid?: string;
        id?: string;
        email?: string;
        role?: string;
        [key: string]: any;
      };
      firebaseUser?: any;
      userData?: any;
    }
  }
}

export {};
