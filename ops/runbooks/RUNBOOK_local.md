# دليل تشغيل الخلفية محليًا (Local Development)

## متطلبات النظام
- **Node.js**: v16 أو أحدث
- **MongoDB**: v4.4 أو أحدث (محلي أو Atlas)
- **Redis**: v5 أو أحدث (محلي أو خدمة سحابية)
- **Git**: لاستنساخ المشروع

## خطوات الإعداد

### 1. استنساخ المشروع وتثبيت التبعيات
```bash
git clone <repository-url>
cd Backend
npm install
```

### 2. إعداد متغيرات البيئة
انسخ ملف `.env.example` إلى `.env` وقم بتعديل القيم حسب البيئة المحلية:

```bash
cp .env.example .env
```

### 3. المتغيرات البيئية المطلوبة

#### قاعدة البيانات
```env
MONGO_URI=mongodb://localhost:27017/bthwani
# أو لـ MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/bthwani
```

#### Redis
```env
REDIS_URL=redis://localhost:6379
# أو لـ Redis Cloud:
# REDIS_URL=rediss://username:password@host:port
```

#### Firebase (إذا كان مطلوبًا)
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key\n-----END PRIVATE KEY-----"
```

#### JWT Secrets
```env
JWT_SECRET=your-super-secret-jwt-key-here
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
```

#### البريد الإلكتروني (SMTP)
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourdomain.com
```

#### WhatsApp (اختياري)
```env
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
```

#### Twilio (اختياري)
```env
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
```

#### إعدادات أخرى
```env
NODE_ENV=development
PORT=3000
TZ=Asia/Aden
INDEX_SYNC_TIMEOUT_MS=60000
```

### 4. إعداد قاعدة البيانات

#### MongoDB محلي
```bash
# تشغيل MongoDB محليًا
mongod --dbpath ./data/db

# أو استخدام Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Redis محلي
```bash
# تشغيل Redis محليًا
redis-server

# أو استخدام Docker
docker run -d -p 6379:6379 --name redis redis:latest
```

### 5. بناء وتشغيل المشروع

#### تشغيل في وضع التطوير (Development)
```bash
npm run dev
```
سيقوم هذا بالتشغيل مع إعادة التحميل التلقائي عند تغيير الملفات.

#### بناء المشروع للإنتاج
```bash
npm run build
```

#### تشغيل في الإنتاج
```bash
npm start
```

## اختبار التشغيل

### 1. فحص حالة الخدمة
بعد التشغيل، يجب أن تكون الخدمة متاحة على:
```
http://localhost:3000
```

### 2. فحص نقاط النهاية الأساسية
```bash
# فحص حالة الخدمة
curl http://localhost:3000/health

# فحص إصدار API
curl http://localhost:3000/api/version
```

### 3. فحص السجلات (Logs)
في وضع التطوير، ستظهر السجلات في الكونسول. ابحث عن:
```
✅ Server running on port 3000
🔗 Connected to MongoDB
🔗 Connected to Redis
🔧 Syncing indexes for model: [اسم النموذج]
```

## استكشاف الأخطاء

### مشاكل شائعة وحلولها:

#### خطأ في الاتصال بـ MongoDB
```
❌ MongoServerError: Authentication failed
```
**الحل**: تأكد من صحة `MONGO_URI` وقاعدة البيانات متاحة.

#### خطأ في الاتصال بـ Redis
```
❌ Redis connection failed
```
**الحل**: تأكد من تشغيل Redis وصحة `REDIS_URL`.

#### خطأ في متغيرات البيئة
```
❌ [firebaseAdmin] FIREBASE_PROJECT_ID present?: false
```
**الحل**: تأكد من وجود جميع متغيرات Firebase المطلوبة في `.env`.

#### مشكلة في المنفذ
```
❌ Error: listen EADDRINUSE: address already in use :::3000
```
**الحل**: أغلق أي خدمة تستخدم المنفذ 3000 أو غير المنفذ في `.env`.

## ملاحظات مهمة
- لا تشارك ملف `.env` أبدًا في المشروع
- استخدم كلمات مرور قوية للإنتاج
- في الإنتاج، استخدم خدمات سحابية آمنة لـ MongoDB وRedis
- راقب استخدام الذاكرة والمعالج خاصة مع قوائم الانتظار (Queues)
