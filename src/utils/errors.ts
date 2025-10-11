export class AppError extends Error {
  status: number;
  code: string;
  detail?: any;
  userMessage?: string;
  suggestedAction?: string;

  constructor(
    status: number,
    code: string,
    message?: string,
    detail?: any,
    userMessage?: string,
    suggestedAction?: string
  ) {
    super(message || code);
    this.status = status;
    this.code = code;
    this.detail = detail;
    this.userMessage = userMessage;
    this.suggestedAction = suggestedAction;
  }
}

export const ERR = {
  INVALID_TOKEN_FORMAT: (detail?: any) => new AppError(
    401,
    "INVALID_TOKEN_FORMAT",
    "Invalid token format",
    detail,
    "رمز الدخول الذي قدمته غير صالح أو منتهي الصلاحية",
    "يرجى تسجيل الدخول مرة أخرى أو التحقق من صحة الرمز"
  ),
  UNAUTHORIZED: (detail?: any) => new AppError(
    401,
    "UNAUTHORIZED",
    "Unauthorized",
    detail,
    "ليس لديك صلاحية للوصول إلى هذا المحتوى",
    "يرجى تسجيل الدخول أولاً أو التحقق من صلاحيات حسابك"
  ),
  ADMIN_REQUIRED: (detail?: any) => new AppError(
    403,
    "ADMIN_REQUIRED",
    "Admin access required",
    detail,
    "هذه الصفحة تتطلب صلاحيات مدير",
    "يرجى الاتصال بمدير النظام للحصول على الصلاحيات المطلوبة"
  ),
  VALIDATION_FAILED: (detail?: any) => new AppError(
    400,
    "VALIDATION_FAILED",
    "Validation failed",
    detail,
    "البيانات المدخلة غير صحيحة أو ناقصة",
    "يرجى التحقق من البيانات المدخلة والتأكد من اكتمال جميع الحقول المطلوبة"
  ),
  RATE_LIMITED: () => new AppError(
    429,
    "RATE_LIMITED",
    "Too many requests",
    undefined,
    "لقد تجاوزت الحد المسموح للطلبات",
    "يرجى الانتظار قليلاً قبل إرسال طلب جديد"
  ),
  INTERNAL: (detail?: any) => new AppError(
    500,
    "INTERNAL_ERROR",
    "Unexpected server error",
    detail,
    "حدث خطأ فني في النظام",
    "يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني إذا استمر الخطأ"
  ),
  NETWORK_ERROR: () => new AppError(
    503,
    "NETWORK_ERROR",
    "Network error",
    undefined,
    "مشكلة في الاتصال بالشبكة",
    "يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى"
  ),
  DATA_NOT_FOUND: (resource?: string) => new AppError(
    404,
    "DATA_NOT_FOUND",
    "Data not found",
    undefined,
    `لم يتم العثور على ${resource || 'البيانات المطلوبة'}`,
    "يرجى التحقق من صحة البيانات أو المعايير المستخدمة في البحث"
  ),
  DUPLICATE_ENTRY: (field?: string) => new AppError(
    409,
    "DUPLICATE_ENTRY",
    "Duplicate entry",
    undefined,
    `هذا ${field || 'الإدخال'} موجود بالفعل`,
    "يرجى استخدام قيمة مختلفة أو تعديل الإدخال الموجود"
  )
};
