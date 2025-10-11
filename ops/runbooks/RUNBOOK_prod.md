# دليل تشغيل الخلفية على البيئة الإنتاجية (Production)

## نظرة عامة
هذا الدليل يغطي متغيرات البيئة الإنتاجية وإعدادات المراقبة والأمان للخلفية في الإنتاج.

## متغيرات البيئة الإنتاجية

### قاعدة البيانات (MongoDB Atlas Production)
```env
MONGO_URI=mongodb+srv://prod-user:prod-secure-password@prod-cluster.mongodb.net/bthwani-prod
```

### Redis (Redis Cloud/Upstash Production)
```env
REDIS_URL=rediss://prod-redis-url:6380
REDIS_TLS=true
REDIS_PASSWORD=prod-redis-secure-password
```

### Firebase Production
```env
FIREBASE_PROJECT_ID=your-production-firebase-project
FIREBASE_CLIENT_EMAIL=prod-service-account@prod-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Production_Private_Key\n-----END PRIVATE KEY-----"
```

### JWT Secrets Production
```env
JWT_SECRET=production-ultra-secure-jwt-key-make-it-very-long-and-random-2024
JWT_ACCESS_SECRET=production-access-secret-very-long-and-random-2024
JWT_REFRESH_SECRET=production-refresh-secret-very-long-and-random-2024
```

### البريد الإلكتروني Production (SMTP)
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=production-email@yourdomain.com
SMTP_PASS=production-secure-app-password
FROM_EMAIL=noreply@yourdomain.com
```

### إعدادات Production إضافية
```env
NODE_ENV=production
PORT=10000
TZ=Asia/Aden
INDEX_SYNC_TIMEOUT_MS=60000

# مراقبة وتسجيل Production
LOG_LEVEL=warn
ENABLE_METRICS=true
TRUST_PROXY=true

# أمان إضافي
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

## روابط المراقبة والتنبيهات

### 1. حالة الخدمة الأساسية
- **Production API**: `https://api.yourdomain.com`
- **Health Check**: `https://api.yourdomain.com/health`
- **API Version**: `https://api.yourdomain.com/api/version`

### 2. مراقبة قاعدة البيانات
- **MongoDB Atlas Dashboard**: `https://cloud.mongodb.com`
  - مراقبة الـ Performance، Storage، و Connections
  - إعداد تنبيهات على Slow Queries و High CPU Usage

### 3. مراقبة Redis
- **Redis Cloud Dashboard**: `https://app.redislabs.com`
  - مراقبة Memory Usage، Connections، و Throughput
  - إعداد تنبيهات على Memory > 80% و Connection spikes

### 4. مراقبة البنية التحتية (Render)
- **Render Dashboard**: `https://dashboard.render.com`
  - مراقبة CPU، Memory، و Network usage
  - سجلات التطبيق (Application Logs)

### 5. أدوات مراقبة خارجية موصى بها

#### مراقبة حالة الخدمة (Uptime Monitoring)
```bash
# استخدم إحدى هذه الخدمات:
- UptimeRobot: https://uptimerobot.com
- Pingdom: https://www.pingdom.com
- StatusCake: https://www.statuscake.com
```

#### مراقبة الأداء والأخطاء
```bash
# خدمات موصى بها:
- Sentry: https://sentry.io (للأخطاء والـ performance)
- New Relic: https://newrelic.com (مراقبة شاملة)
- DataDog: https://www.datadoghq.com (مراقبة متقدمة)
```

## إعداد التنبيهات

### 1. تنبيهات حالة الخدمة
```bash
# إعداد مراقبة كل دقيقة على:
URL: https://api.yourdomain.com/health
الرد المتوقع: {"status": "ok"}
```

### 2. تنبيهات قاعدة البيانات
- **MongoDB Atlas**: إعداد تنبيهات على:
  - CPU usage > 80%
  - Memory usage > 80%
  - Replication lag > 10 seconds
  - Connection count > 80% من الحد الأقصى

### 3. تنبيهات Redis
- **Redis Cloud**: إعداد تنبيهات على:
  - Memory usage > 85%
  - Connection count > 1000
  - Evicted keys > 100 per minute

### 4. تنبيهات الأداء
- **Response time > 5 seconds** لأي endpoint مهم
- **Error rate > 5%** في آخر 10 دقائق
- **High memory usage** في الخدمة (> 80%)

## جداول الصيانة والمراقبة

### المراقبة اليومية (Daily Checks)
- [ ] فحص حالة جميع الخدمات
- [ ] مراجعة السجلات بحثًا عن أخطاء جديدة
- [ ] فحص استخدام الموارد (CPU/Memory)
- [ ] التأكد من صحة قاعدة البيانات والـ backup

### المراقبة الأسبوعية (Weekly Checks)
- [ ] تحليل اتجاهات الأداء
- [ ] مراجعة السجلات المؤرشفة
- [ ] اختبار خطة الاستعادة من النسخ الاحتياطي
- [ ] فحص الأمان وتحديث الاعتماديات

### المراقبة الشهرية (Monthly Checks)
- [ ] مراجعة شاملة للأمان
- [ ] بدل مفاتيح الأمان (rotation)
- [ ] اختبار سيناريوهات الكوارث
- [ ] تحديث الوثائق والـ runbooks

## إجراءات الطوارئ

### 1. في حالة انقطاع الخدمة (Service Down)
```bash
# خطوات فورية:
1. فحص Render Dashboard للسجلات
2. فحص MongoDB Atlas لأي مشاكل
3. فحص Redis لأي مشاكل في الاتصال
4. إعادة تشغيل الخدمة إذا لزم الأمر
5. إشعار الفريق عبر Slack/Email
```

### 2. في حالة مشكلة في قاعدة البيانات
```bash
# إجراءات:
1. فحص MongoDB Atlas dashboard
2. التحقق من النسخ الاحتياطية الأخيرة
3. في حالة فقدان بيانات، تفعيل خطة الاستعادة
4. إشعار فريق التطوير والدعم الفني
```

### 3. في حالة هجوم أمني
```bash
# إجراءات أمنية فورية:
1. إيقاف الخدمة مؤقتًا إذا لزم الأمر
2. بدل جميع مفاتيح الأمان فورًا
3. فحص السجلات بحثًا عن أنشطة مشبوهة
4. إشعار فريق الأمان والإدارة
5. التحقيق في سبب الهجوم وإصلاح الثغرات
```

## قائمة التحقق من الأمان (Security Checklist)

### متغيرات البيئة الآمنة:
- [ ] جميع مفاتيح JWT قوية وليست افتراضية
- [ ] مفاتيح Firebase محدثة وغير مشتركة
- [ ] كلمات مرور قواعد البيانات معقدة
- [ ] مفاتيح Redis محمية بكلمة مرور

### إعدادات الأمان:
- [ ] CORS محدد للنطاقات المسموحة فقط
- [ ] Rate limiting مفعل ومحدد بشكل مناسب
- [ ] Helmet مفعل للحماية من ثغرات أمنية شائعة
- [ ] متغير TRUST_PROXY مضبوط للإنتاج

### مراقبة الأمان:
- [ ] سجلات محفوظة ومراقبة بحثًا عن هجمات
- [ ] تنبيهات على محاولات الدخول الفاشلة
- [ ] مراقبة استخدام API غير الطبيعي
- [ ] فحوصات دورية للثغرات الأمنية

## معلومات الاتصال للطوارئ

### فريق التطوير:
- **DevOps Engineer**: [الاسم] - [البريد الإلكتروني] - [الهاتف]
- **Lead Developer**: [الاسم] - [البريد الإلكتروني] - [الهاتف]
- **Security Officer**: [الاسم] - [البريد الإلكتروني] - [الهاتف]

### خدمات خارجية:
- **MongoDB Atlas Support**: https://support.mongodb.com
- **Redis Cloud Support**: https://redis.com/company/support/
- **Render Support**: https://render.com/support

## جدولة بدل المفاتيح (Key Rotation Schedule)

### مفاتيح يجب بدلها دوريًا:
| المفتاح | الدورة | آخر تحديث | المسؤول |
|---------|--------|-------------|----------|
| JWT_SECRET | كل 3 أشهر | [التاريخ] | [المسؤول] |
| JWT_ACCESS_SECRET | كل 3 أشهر | [التاريخ] | [المسؤول] |
| JWT_REFRESH_SECRET | كل 3 أشهر | [التاريخ] | [المسؤول] |
| Database Passwords | كل 6 أشهر | [التاريخ] | [المسؤول] |
| Redis Password | كل 6 أشهر | [التاريخ] | [المسؤول] |
| Firebase Keys | عند الاشتباه في تسرب | [التاريخ] | [المسؤول] |

## ملاحظات نهائية مهمة

1. **لا تشارك هذه الوثيقة مع أي شخص خارج الفريق المصرح له**
2. **راجع وحدث هذا الدليل كل 3 أشهر**
3. **احتفظ بنسخة آمنة من هذا الدليل في نظام إدارة كلمات المرور**
4. **تأكد من تحديث معلومات الاتصال بانتظام**
5. **اختبر خطط الطوارئ بانتظام**
