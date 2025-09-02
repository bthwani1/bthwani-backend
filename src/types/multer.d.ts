// types/multer.d.ts
declare module 'multer' {
  import { Request } from 'express';

  namespace multer {
    interface File {
      /** مثال على بعض الحقول الشائعة */
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      buffer: Buffer;
      size: number;
    }
  }

  function multer(options?: multer.Options): any;
  namespace multer {}
  export = multer;
}
