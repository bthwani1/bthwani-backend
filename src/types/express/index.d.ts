// src/@types/express/index.d.ts
declare namespace Express {
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

export {}; // يجعل الملف وحدة النوع دون تحويله إلى module للتوسيع
