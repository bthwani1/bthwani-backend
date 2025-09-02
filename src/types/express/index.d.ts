// src/types/express/index.d.ts

import { AdminPayload } from '../../types';       // تأكد من المسار الصحيح لملف types.ts حيث صدّرت AdminPayload
import { UserDocument } from '../../models/user'; // حسب مسار نموذج المستخدم في مشروعك

declare global {
  namespace Express {
    interface Request {
      /**
       * بيانات المستخدم الموثّق بها (JWT payload)
       * من النوع AdminPayload
       */
      user?: AdminPayload;

      /**
       * إذا كنت تحتاج للاحتفاظ بوثيقة المستخدم الكاملة
       */
      userData?: UserDocument;

      /**
       * params عامة
       */
      params: Record<string, string>;
    }
  }
}

export {};
