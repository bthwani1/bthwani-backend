# Backend Rollback Handbook

## نظرة عامة
دليل شامل لإجراءات الاسترجاع (Rollback) في نظام Backend مع ضمان سلامة البيانات والخدمات.

## استراتيجية الإصدارات

### تسميات الإصدارات الموحدة
```
backend-vYYYY.MM.DD-HHMM
```
**أمثلة:**
- `backend-v2025.01.15-1430`
- `backend-v2025.01.15-1500`
- `backend-v2025.01.16-0900`

### Artifacts المطلوبة
- صورة Docker مع tag الإصدار
- Build مجمع قابل للاسترجاع
- Backup قاعدة البيانات قبل كل ترقية

## النسخ الاحتياطي لقاعدة البيانات

### قبل كل ترقية (إجباري)

#### MongoDB Atlas (موصى به)
```bash
# استخدم Atlas Dashboard أو API لإنشاء snapshot
# أو استخدم PITR (Point-in-Time Recovery)
```

#### بديل عام (mongodump)
```bash
#!/bin/bash
# إنشاء backup قبل الترقية
BACKUP_NAME="backup-$(date +%Y-%m-%d-%H%M)"
mongodump --uri "$MONGO_URI" --archive="$BACKUP_NAME.gz" --gzip

# نسخ إلى مكان آمن
aws s3 cp "$BACKUP_NAME.gz" "s3://bthwani-backups/$BACKUP_NAME.gz"
# أو حفظ محلياً في مجلد آمن
```

### حفظ معلومات الإصدار
```bash
# حفظ معلومات الإصدار الحالي قبل الترقية
echo "$(date): Current version before upgrade" >> deployment.log
git log --oneline -1 >> deployment.log
```

## خطة الاسترجاع (Rollback Plan)

### سيناريوهات الاسترجاع

#### SEV1 (توقف حرج)
- **السبب**: فشل في الخدمة، خطأ في قاعدة البيانات، فقدان بيانات
- **الوقت المستهدف**: خلال 15 دقيقة
- **الإجراء**: رجوع فوري إلى آخر إصدار مستقر

#### SEV2 (خلل جزئي)
- **السبب**: مشاكل في وظائف معينة، بطء في الأداء
- **الوقت المستهدف**: خلال ساعة واحدة
- **الإجراء**: تقييم الأثر واتخاذ قرار الرجوع أو الإصلاح

#### SEV3 (مشاكل طفيفة)
- **السبب**: أخطاء UI، مشاكل عرض بيانات
- **الوقت المستهدف**: خلال يوم عمل
- **الإجراء**: إصلاح سريع أو رجوع حسب الأثر

## إجراءات الاسترجاع التفصيلية

### 1. تقييم الوضع (الخطوات الأولى)
```bash
# فحص حالة الخدمة الحالية
curl -f https://api.bthwani.com/health || echo "Service Down!"

# فحص اللوجز للأخطاء الأخيرة
kubectl logs -l app=backend --tail=100

# فحص حالة قاعدة البيانات
mongosh "$MONGO_URI" --eval "db.stats()"
```

### 2. إنشاء Backup حالي (احتياطي)
```bash
# إنشاء backup فوري للحالة الحالية قبل الرجوع
CURRENT_BACKUP="emergency-backup-$(date +%Y-%m-%d-%H%M)"
mongodump --uri "$MONGO_URI" --archive="$CURRENT_BACKUP.gz" --gzip
```

### 3. استرجاع التطبيق

#### طريقة Render (موصى بها)
```bash
# 1. اذهب إلى Render Dashboard
# 2. اختر الخدمة المتأثرة
# 3. اذهب إلى "Deploy" tab
# 4. اختر "Rollback" من القائمة
# 5. اختر الإصدار السابق المستقر
# 6. انتظر حتى اكتمال النشر
```

#### طريقة Docker Manual
```bash
# إيقاف الخدمة الحالية
docker stop backend-container

# تشغيل الإصدار السابق
docker run -d \
  --name backend-rollback \
  -p 3000:3000 \
  --env-file .env \
  bthwani/backend:backend-v2025.01.15-1430

# فحص أن الخدمة تعمل
sleep 10
curl -f http://localhost:3000/health
```

### 4. استرجاع قاعدة البيانات (إن لزم الأمر)

#### الحالات التي تتطلب رجوع قاعدة البيانات:
- تلف في البيانات الجديدة
- مشاكل في الهجرة (migration) الجديدة
- فقدان بيانات مهمة

#### إجراء الاسترجاع الكامل:
```bash
# تحذير: هذا يمحو جميع البيانات بعد وقت النسخة الاحتياطية
mongorestore --uri "$MONGO_URI" \
  --archive=backup-2025-01-15-1430.gz \
  --gzip \
  --drop

# فحص حالة قاعدة البيانات بعد الاسترجاع
mongosh "$MONGO_URI" --eval "db.stats()"
```

#### استرجاع انتقائي (مفضل في معظم الحالات):
```bash
# استرجاع مجموعة محددة فقط (namespace)
mongorestore --uri "$MONGO_URI" \
  --archive=backup-2025-01-15-1430.gz \
  --gzip \
  --nsInclude="bthwani.orders" \
  --nsInclude="bthwani.transactions"

# أو استرجاع مجموعات محددة بناءً على التاريخ
mongorestore --uri "$MONGO_URI" \
  --archive=backup-2025-01-15-1430.gz \
  --gzip \
  --nsInclude="bthwani.*" \
  --nsFrom="2025-01-15T14:00:00Z" \
  --nsTo="2025-01-15T15:00:00Z"
```

### 5. اختبار ما بعد الاسترجاع

#### فحص الصحة الأساسية:
```bash
# فحص endpoint الصحة
curl -f https://api.bthwani.com/health

# فحص قاعدة البيانات
mongosh "$MONGO_URI" --eval "db.adminCommand('ismaster')"

# فحص الخدمات الأساسية
curl -f https://api.bthwani.com/api/v1/test
```

#### سيناريو اختبار شامل:
```bash
#!/bin/bash
# اختبار سيناريو "طلب → محفظة → تسوية"

echo "Testing complete order flow..."

# 1. إنشاء طلب تجريبي
ORDER_RESPONSE=$(curl -X POST https://api.bthwani.com/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{"test": true}')

echo "Order created: $ORDER_RESPONSE"

# 2. فحص حالة المحفظة
WALLET_RESPONSE=$(curl -s https://api.bthwani.com/api/v1/wallet)

echo "Wallet status: $WALLET_RESPONSE"

# 3. فحص التسوية
SETTLEMENT_RESPONSE=$(curl -s https://api.bthwani.com/api/v1/settlements/pending)

echo "Pending settlements: $SETTLEMENT_RESPONSE"

echo "All tests completed successfully!"
```

#### فحص عدم وجود فروقات في القيود:
```bash
# فحص تطابق القيود المالية
curl -s https://api.bthwani.com/api/v1/reports/financial-balance

# فحص سجلات التدقيق
curl -s https://api.bthwani.com/admin/audit-logs/stats
```

## جدولة الاسترجاع

### متى يتم الاسترجاع؟
1. **فوراً**: إذا تأثرت الخدمات الأساسية (طلبات، دفعات)
2. **خلال ساعة**: إذا تأثرت وظائف مهمة لكن غير حرجة
3. **خلال يوم عمل**: إذا كانت مشاكل طفيفة في واجهة المستخدم

### من يقرر الاسترجاع؟
- **SEV1**: فريق DevOps + Backend Lead فوراً
- **SEV2**: Product Manager + Technical Lead
- **SEV3**: فريق التطوير بعد تقييم الأثر

## مراقبة ما بعد الاسترجاع

### مؤشرات النجاح:
1. `/health` يرجع `OK`
2. جميع الـ APIs تعمل بشكل طبيعي
3. لا توجد أخطاء في اللوجز
4. قاعدة البيانات تعمل بشكل طبيعي
5. السيناريوهات الوظيفية تعمل بنجاح

### مراقبة مستمرة:
```bash
# مراقبة الخدمة لمدة ساعة بعد الرجوع
watch -n 60 'curl -f https://api.bthwani.com/health && echo "Service OK at $(date)"'

# مراقبة استخدام الموارد
kubectl top pods -l app=backend

# مراقبة اللوجز للأخطاء الجديدة
kubectl logs -l app=backend --tail=100 -f
```

## التوثيق والتقارير

### بعد كل استرجاع:
1. **تسجيل الحادث**: في نظام إدارة الحوادث
2. **تحليل السبب الجذري**: اجتماع Post-Mortem
3. **تحسين العملية**: تحديث هذا الدليل إن لزم الأمر
4. **إشعار الفرق المعنية**: عبر Slack/Email

### نموذج تقرير الاسترجاع:
```markdown
# تقرير استرجاع [التاريخ]

## تفاصيل الحادث
- **الوقت**: YYYY-MM-DD HH:MM
- **المستوى**: SEV1/SEV2/SEV3
- **السبب**: وصف مختصر للمشكلة

## إجراءات الاسترجاع
- **الإصدار المسترجع إليه**: backend-vYYYY.MM.DD-HHMM
- **وقت البدء**: HH:MM
- **وقت الانتهاء**: HH:MM
- **المدة الإجمالية**: XM

## نتائج الاختبار
- [ ] /health يعمل
- [ ] السيناريوهات الوظيفية تعمل
- [ ] لا فروقات في القيود المالية

## الدروس المستفادة
- [وصف الدرس المستفاد والتحسينات المقترحة]
```

## ملحقات

### أوامر مفيدة للاسترجاع السريع:
```bash
# فحص الإصدار الحالي
curl -s https://api.bthwani.com/health | jq -r '.version'

# قائمة الإصدارات المتاحة في Docker Registry
curl -s "https://registry.hub.docker.com/v2/repositories/bthwani/backend/tags?page_size=10" | jq -r '.results[].name'

# فحص حالة قاعدة البيانات
mongosh "$MONGO_URI" --eval "db.adminCommand({listCollections: 1})"
```

### نقاط الاتصال للطوارئ:
- **Slack**: #backend-emergency
- **Email**: backend-team@bthwani.com
- **Phone**: +966-XX-XXXXXXX (Backend Lead)

---
**تاريخ آخر تحديث**: 15 يناير 2025
**الإصدار**: 1.0.0
**مسؤول الصيانة**: فريق DevOps
