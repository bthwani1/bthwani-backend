import { Request, Response } from 'express';
import DataDeletionRequest, { IDataDeletionRequest, DeletionStatus } from '../../models/DataDeletionRequest';
import { NotificationService } from '../../services/notificationService';
import crypto from 'crypto';

/**
 * إنشاء طلب حذف بيانات جديد
 */
export const createDataDeletionRequest = async (req: Request, res: Response) => {
  try {
    const { userId, userType, reason, dataTypes } = req.body;
    const requestedBy = (req as any).user?.id;

    // التحقق من صحة البيانات
    if (!userId || !userType || !dataTypes || !Array.isArray(dataTypes)) {
       res.status(400).json({
        message: 'بيانات غير مكتملة: userId, userType, dataTypes مطلوبة',
        error: 'INVALID_REQUEST'
      });
      return;
    }

    // التحقق من وجود طلب نشط سابق
    const existingRequest = await DataDeletionRequest.findOne({
      userId,
      status: { $in: ['PENDING', 'PROCESSING'] }
    });

    if (existingRequest) {
       res.status(409).json({
        message: 'يوجد طلب حذف نشط سابق لهذا المستخدم',
        error: 'ACTIVE_REQUEST_EXISTS'
      });
      return;
    }

    // إنشاء رمز التحقق
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // إنشاء طلب الحذف
    const deletionRequest = new DataDeletionRequest({
      userId,
      userType,
      requestedBy,
      reason,
      dataTypes,
      verificationToken
    });

    await deletionRequest.save();

    res.status(201).json({
      message: 'تم إنشاء طلب حذف البيانات بنجاح',
      requestId: deletionRequest._id,
      verificationToken,
      status: deletionRequest.status,
      estimatedProcessingTime: 'قد يستغرق معالجة الطلب حتى 30 يوماً'
    });

  } catch (error) {
    console.error('Error creating data deletion request:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

/**
 * جلب طلبات حذف البيانات (للمدراء)
 */
export const getDataDeletionRequests = async (req: Request, res: Response) => {
  try {
    const {
      status,
      userType,
      page = 1,
      limit = 20,
      userId
    } = req.query;

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (userType) {
      filter.userType = userType;
    }

    if (userId) {
      filter.userId = userId;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const requests = await DataDeletionRequest.find(filter)
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'username email')
      .populate('requestedBy', 'username');

    const total = await DataDeletionRequest.countDocuments(filter);

    res.json({
      requests,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalRequests: total,
        hasNext: skip + requests.length < total,
        hasPrev: Number(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching data deletion requests:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

/**
 * جلب طلب حذف محدد
 */
export const getDataDeletionRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const request = await DataDeletionRequest.findById(id)
      .populate('userId', 'username email')
      .populate('requestedBy', 'username');

    if (!request) {
       res.status(404).json({ message: 'طلب الحذف غير موجود' });
       return;
    }

    res.json({ request });

  } catch (error) {
    console.error('Error fetching data deletion request:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

/**
 * إلغاء طلب حذف (فقط من قبل الطالب أو مدير)
 */
export const cancelDataDeletionRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.roles?.[0];

    const request = await DataDeletionRequest.findById(id);

    if (!request) {
       res.status(404).json({ message: 'طلب الحذف غير موجود' });
       return;
    }

    // التحقق من الصلاحية (الطالب أو مدير)
    if (request.requestedBy.toString() !== userId && userRole !== 'SUPERADMIN') {
       res.status(403).json({
        message: 'غير مصرح لك بإلغاء هذا الطلب',
        error: 'UNAUTHORIZED'
      });
      return;
    }

    // التحقق من إمكانية الإلغاء
    if (!['PENDING', 'PROCESSING'].includes(request.status)) {
       res.status(400).json({
        message: 'لا يمكن إلغاء طلب في هذه المرحلة',
        error: 'CANNOT_CANCEL'
      });
      return;
    }

    request.status = 'CANCELLED';
    await request.save();

    res.json({
      message: 'تم إلغاء طلب الحذف بنجاح',
      request
    });

  } catch (error) {
    console.error('Error cancelling data deletion request:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

/**
 * معالجة طلب حذف (للمدراء فقط)
 */
export const processDataDeletionRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, adminNotes } = req.body;
    const adminId = (req as any).user?.id;

    const request = await DataDeletionRequest.findById(id);

    if (!request) {
       res.status(404).json({ message: 'طلب الحذف غير موجود' });
       return;
    }

    if (request.status !== 'PENDING') {
       res.status(400).json({
        message: 'لا يمكن معالجة طلب في هذه المرحلة',
        error: 'INVALID_STATUS'
      });
      return;
      }

    request.status = action === 'approve' ? 'PROCESSING' : 'CANCELLED';
    request.processedAt = new Date();
    request.adminNotes = adminNotes;

    if (action === 'approve') {
      // بدء عملية الحذف
      await performDataDeletion(request);

      request.status = 'COMPLETED';
      request.completedAt = new Date();

      // إرسال إشعار نجاح
      await NotificationService.sendDataDeletionSuccess(
        request.userId.toString(),
        request.dataTypes.join(', ')
      );
      return;
    }

    await request.save();

    res.json({
      message: action === 'approve' ? 'تمت الموافقة على طلب الحذف وبدء المعالجة' : 'تم رفض طلب الحذف',
      request
    });

  } catch (error) {
    console.error('Error processing data deletion request:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

/**
 * تنفيذ عملية حذف البيانات فعلياً
 */
async function performDataDeletion(request: IDataDeletionRequest): Promise<void> {
  try {
    const { userId, dataTypes } = request;

    // حذف البيانات حسب النوع
    for (const dataType of dataTypes) {
      switch (dataType) {
        case 'PROFILE':
          await deleteUserProfile(userId);
          break;
        case 'ORDERS':
          await deleteUserOrders(userId);
          break;
        case 'PAYMENTS':
          await deleteUserPayments(userId);
          break;
        case 'LOCATIONS':
          await deleteUserLocations(userId);
          break;
        case 'COMMUNICATIONS':
          await deleteUserCommunications(userId);
          break;
        case 'LOGS':
          await deleteUserLogs(userId);
          break;
        case 'ALL':
          // حذف كل شيء
          await Promise.all([
            deleteUserProfile(userId),
            deleteUserOrders(userId),
            deleteUserPayments(userId),
            deleteUserLocations(userId),
            deleteUserCommunications(userId),
            deleteUserLogs(userId)
          ]);
          break;
      }
    }

  } catch (error) {
    console.error('Error in data deletion process:', error);

    // تحديث حالة الطلب إلى فاشل
    request.status = 'FAILED';
    request.errorMessage = error.message || 'خطأ غير محدد في عملية الحذف';

    // إرسال إشعار فشل
    await NotificationService.sendDataDeletionFailure(
      request.userId.toString(),
      request.dataTypes.join(', '),
      request.errorMessage
    );

    throw error;
  }
}

/**
 * دوال حذف البيانات حسب النوع (أمثلة - يجب تخصيصها حسب النماذج الفعلية)
 */
async function deleteUserProfile(userId: any): Promise<void> {
  // حذف البيانات الشخصية - مثال عام
  console.log(`Deleting profile data for user: ${userId}`);
  // يجب إضافة منطق الحذف الفعلي حسب النماذج الموجودة
}

async function deleteUserOrders(userId: any): Promise<void> {
  console.log(`Deleting orders data for user: ${userId}`);
  // يجب إضافة منطق الحذف الفعلي
}

async function deleteUserPayments(userId: any): Promise<void> {
  console.log(`Deleting payments data for user: ${userId}`);
  // يجب إضافة منطق الحذف الفعلي
}

async function deleteUserLocations(userId: any): Promise<void> {
  console.log(`Deleting locations data for user: ${userId}`);
  // يجب إضافة منطق الحذف الفعلي
}

async function deleteUserCommunications(userId: any): Promise<void> {
  console.log(`Deleting communications data for user: ${userId}`);
  // يجب إضافة منطق الحذف الفعلي
}

async function deleteUserLogs(userId: any): Promise<void> {
  console.log(`Deleting logs data for user: ${userId}`);
  // يجب إضافة منطق الحذف الفعلي
}
