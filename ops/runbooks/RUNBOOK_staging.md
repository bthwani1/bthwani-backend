# دليل تشغيل الخلفية على البيئة التجريبية (Staging)

## نظرة عامة
هذا الدليل يغطي نشر وتشغيل الخلفية على البيئة التجريبية باستخدام Render.

## متغيرات البيئة للـ Staging

### قاعدة البيانات (MongoDB Atlas)
```env
MONGO_URI=mongodb+srv://staging-user:staging-password@staging-cluster.mongodb.net/bthwani-staging
```

### Redis (Redis Cloud/Upstash)
```env
REDIS_URL=rediss://staging-redis-url:6379
REDIS_TLS=true
```

### Firebase
```env
FIREBASE_PROJECT_ID=your-staging-firebase-project
FIREBASE_CLIENT_EMAIL=staging-service-account@staging-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Staging_Private_Key\n-----END PRIVATE KEY-----"
```

### JWT Secrets
```env
JWT_SECRET=staging-super-secret-jwt-key-here-make-it-long-and-random
JWT_ACCESS_SECRET=staging-access-secret-here-make-it-long-and-random
JWT_REFRESH_SECRET=staging-refresh-secret-here-make-it-long-and-random
```

### البريد الإلكتروني (SMTP)
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=staging-email@yourdomain.com
SMTP_PASS=staging-app-password
FROM_EMAIL=staging-noreply@yourdomain.com
```

### إعدادات أخرى
```env
NODE_ENV=staging
PORT=10000
TZ=Asia/Aden
INDEX_SYNC_TIMEOUT_MS=60000

# مراقبة وتسجيل
LOG_LEVEL=info
ENABLE_METRICS=true
```

## خطوات النشر على Staging

### 1. إعداد المتغيرات في Render Dashboard

#### خطوات مفصلة:
1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اختر الخدمة `bthwani-backend-staging`
3. اذهب إلى **Environment**
4. اضغط **Add Environment Variable** لكل متغير من القائمة أعلاه
5. **لا تضع القيم الحقيقية هنا** - استخدم placeholders أولاً ثم استبدلها بالقيم الحقيقية

#### متغيرات حساسة خاصة بالـ Staging:
- `JWT_SECRET` - أنشئ مفتاح جديد مختلف عن الإنتاج
- `JWT_ACCESS_SECRET` - أنشئ مفتاح جديد مختلف عن الإنتاج
- `JWT_REFRESH_SECRET` - أنشئ مفتاح جديد مختلف عن الإنتاج
- `FIREBASE_PRIVATE_KEY` - مفتاح Firebase للمشروع التجريبي
- `SMTP_PASS` - كلمة مرور التطبيق للبريد التجريبي

### 2. نشر من GitHub

#### عبر Render Dashboard:
1. اذهب إلى **Manual Deploy** في الخدمة
2. اختر الفرع `staging` إذا كان موجودًا، أو `main`
3. اضغط **Deploy latest commit**

#### عبر GitHub Webhook (تلقائي):
سيتم النشر تلقائيًا عند دفع تغييرات إلى الفرع المحدد.

### 3. فحص النشر

#### مراقبة السجلات:
1. في Render Dashboard، اذهب إلى **Logs**
2. ابحث عن رسائل نجاح:
   ```
   ✅ Server running on port 10000
   🔗 Connected to MongoDB
   🔗 Connected to Redis
   ```

#### فحص نقاط النهاية:
```bash
# رابط الخدمة التجريبية (سيكون مختلفًا حسب Render)
curl https://bthwani-backend-staging.onrender.com/health

# فحص إصدار API
curl https://bthwani-backend-staging.onrender.com/api/version
```

## أدوات المراقبة والتنبيهات

### 1. مراقبة الأداء
- **Render Metrics**: استخدم أدوات Render المدمجة
- **Uptime Monitoring**: استخدم خدمة مثل UptimeRobot لرصد حالة الخدمة
- **Log Monitoring**: راقب السجلات بحثًا عن أخطاء

### 2. تنبيهات مهمة للمراقبة

#### استخدم هذه الروابط لإعداد التنبيهات:
- **حالة الخدمة**: `https://bthwani-backend-staging.onrender.com/health`
- **مقاييس قاعدة البيانات**: MongoDB Atlas dashboard
- **مقاييس Redis**: Redis Cloud dashboard
- **سجلات التطبيق**: Render Logs

### 3. أدوات مقترحة للمراقبة
- **UptimeRobot** أو **Pingdom** لمراقبة حالة الخدمة
- **LogRocket** أو **Sentry** لمراقبة الأخطاء
- **New Relic** أو **DataDog** لمراقبة الأداء الشاملة

## خطوات الرجوع (Rollback)

### في حالة حدوث مشكلة:

#### 1. فحص السجلات الأخيرة
```bash
# في Render Dashboard - Logs
# ابحث عن أخطاء حديثة
```

#### 2. إعادة النشر السريع
إذا كانت المشكلة في الكود:
```bash
# ارجع إلى commit سابق مستقر
git revert HEAD
git push origin main
```

#### 3. إعادة تشغيل الخدمة
في Render Dashboard:
1. اذهب إلى الخدمة
2. اضغط **Restart Service**

### 4. التحقق من المتغيرات البيئية
تأكد من أن جميع المتغيرات محدثة وصحيحة في Render.

## ملاحظات أمنية مهمة

### متغيرات حساسة خاصة بالـ Staging:
1. **لا تستخدم نفس مفاتيح الإنتاج**
2. استخدم عناوين بريد مختلفة للاختبار
3. استخدم قاعدة بيانات منفصلة عن الإنتاج
4. راقب استخدام الموارد بانتظام

### جدولة تغيير المفاتيح:
- **JWT Secrets**: بدل كل 3 أشهر
- **Firebase Keys**: بدل عند الاشتباه في تسرب
- **Database Credentials**: بدل كل 6 أشهر أو عند تغيير المطورين

## جدولة الصيانة

### مهام يومية:
- فحص السجلات بحثًا عن أخطاء
- مراقبة استخدام الذاكرة والـ CPU
- فحص حالة قاعدة البيانات

### مهام أسبوعية:
- فحص وتحديث التبعيات (dependencies)
- اختبار نقاط النهاية الرئيسية
- مراجعة استخدام الموارد

### مهام شهرية:
- بدل مفاتيح الأمان (rotation)
- فحص شامل للأمان
- تحديث الاعتماديات الرئيسية
