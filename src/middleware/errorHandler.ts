import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    const errorResponse = {
      error: {
        code: err.code,
        message: err.userMessage || err.message,
        ...(err.suggestedAction && { suggestedAction: err.suggestedAction }),
        ...(process.env.NODE_ENV === 'development' && {
          technical: err.message,
          detail: err.detail,
          stack: err.stack
        })
      }
    };
    res.status(err.status).json(errorResponse);
    return;
  }

  console.error("UNHANDLED ERROR:", err);

  // Provide user-friendly message for unhandled errors
  const errorResponse = {
    error: {
      code: "INTERNAL_ERROR",
      message: "حدث خطأ فني في النظام",
      suggestedAction: "يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني إذا استمر الخطأ",
      ...(process.env.NODE_ENV === 'development' && {
        technical: "Unexpected server error",
        detail: err.message,
        stack: err.stack
      })
    }
  };

  res.status(500).json(errorResponse);
}
