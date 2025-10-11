// scripts/create-bulk-orders.js
const mongoose = require('mongoose');
const DeliveryOrder = require('../src/models/delivery_marketplace_v1/Order');
const DeliveryStore = require('../src/models/delivery_marketplace_v1/DeliveryStore');
const Driver = require('../src/models/Driver_app/driver');
const User = require('../src/models/user');

async function createBulkOrders() {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bthwani');

    console.log('بدء إنشاء 50 طلب تجريبي...');

    // جلب بيانات تجريبية
    const stores = await DeliveryStore.find({}).limit(10).lean();
    const drivers = await Driver.find({}).limit(20).lean();
    const users = await User.find({}).limit(10).lean();

    if (stores.length === 0 || drivers.length === 0 || users.length === 0) {
      console.log('يرجى التأكد من وجود بيانات تجريبية في قاعدة البيانات');
      return;
    }

    const orderTypes = ['marketplace', 'errand'];
    const orderStatuses = ['pending_confirmation', 'under_review', 'preparing', 'assigned', 'out_for_delivery', 'delivered'];
    const cities = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة'];

    const orders = [];

    for (let i = 0; i < 50; i++) {
      const randomStore = stores[Math.floor(Math.random() * stores.length)];
      const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
      const randomStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];

      // إنشاء عنوان عشوائي
      const addresses = [
        'حي النخيل، الرياض',
        'حي الملز، جدة',
        'حي النسيم، الدمام',
        'حي العزيزية، مكة',
        'حي الروضة، المدينة'
      ];
      const randomAddress = addresses[Math.floor(Math.random() * addresses.length)];

      // إنشاء منتجات عشوائية
      const products = [];
      const productCount = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < productCount; j++) {
        products.push({
          productId: new mongoose.Types.ObjectId(),
          name: `منتج تجريبي ${j + 1}`,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: Math.floor(Math.random() * 100) + 10,
          totalPrice: 0 // سيتم حسابه لاحقاً
        });
      }

      // حساب إجمالي الطلب
      const subtotal = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
      const deliveryFee = Math.floor(Math.random() * 20) + 5;
      const tax = Math.floor(subtotal * 0.15);
      const total = subtotal + deliveryFee + tax;

      // تحديث إجمالي كل منتج
      products.forEach(product => {
        product.totalPrice = product.price * product.quantity;
      });

      const order = new DeliveryOrder({
        orderNumber: `TEST-${Date.now()}-${i + 1}`,
        type: randomType,
        status: randomStatus,
        source: randomType === 'errand' ? 'shein' : 'marketplace',

        // معلومات العميل
        user: randomUser._id,
        userInfo: {
          name: randomUser.name || 'عميل تجريبي',
          phone: randomUser.phone || '05xxxxxxxx',
        },

        // معلومات المتجر
        store: randomStore._id,
        storeInfo: {
          name: randomStore.name,
          phone: randomStore.phone || '05xxxxxxxx',
        },

        // عنوان التوصيل
        deliveryAddress: {
          address: randomAddress,
          city: randomCity,
          coordinates: {
            lat: 24 + Math.random() * 2, // نطاق الرياض تقريباً
            lng: 46 + Math.random() * 2,
          }
        },

        // المنتجات
        products: products,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        tax: tax,
        total: total,

        // معلومات إضافية
        notes: `طلب تجريبي رقم ${i + 1}`,
        estimatedDeliveryTime: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000), // خلال أسبوع

        // تعيين سائق عشوائياً حسب الحالة
        ...(randomStatus !== 'pending_confirmation' && randomStatus !== 'under_review' ? {
          driver: randomDriver._id,
          driverInfo: {
            name: randomDriver.fullName,
            phone: randomDriver.phone,
            vehicleType: randomDriver.vehicleType || 'سيارة',
          }
        } : {}),

        // طريقة الدفع
        paymentMethod: ['cash', 'card', 'wallet'][Math.floor(Math.random() * 3)],
        paymentStatus: ['pending', 'paid', 'refunded'][Math.floor(Math.random() * 3)],

        // تاريخ الإنشاء متفرق
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // خلال 30 يوم مضت
      });

      orders.push(order);

      // إضافة تأخير صغير لتجنب الضغط على قاعدة البيانات
      if (i % 10 === 0 && i > 0) {
        console.log(`تم إنشاء ${i} طلب...`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // حفظ جميع الطلبات
    console.log('حفظ الطلبات في قاعدة البيانات...');
    await DeliveryOrder.insertMany(orders);

    console.log(`✅ تم إنشاء ${orders.length} طلب تجريبي بنجاح!`);
    console.log('\nإحصائيات الطلبات المُنشأة:');
    console.log(`- الأنواع: ${orderTypes.join(', ')}`);
    console.log(`- الحالات: ${orderStatuses.join(', ')}`);
    console.log(`- المدن: ${cities.join(', ')}`);
    console.log(`- عدد المتاجر: ${stores.length}`);
    console.log(`- عدد السائقين: ${drivers.length}`);
    console.log(`- عدد العملاء: ${users.length}`);

    console.log('\n📋 للاختبار:');
    console.log('1. اذهب إلى صفحة "الطلبات النشطة" في لوحة الإدارة');
    console.log('2. تأكد من ظهور جميع الطلبات بدون أخطاء');
    console.log('3. اختبر التحديثات اللحظية عبر Socket');
    console.log('4. اختبر تغيير حالات الطلبات');

  } catch (error) {
    console.error('❌ خطأ في إنشاء الطلبات:', error);
  } finally {
    await mongoose.connection.close();
    console.log('تم إغلاق الاتصال بقاعدة البيانات');
  }
}

// تشغيل السكريبت
if (require.main === module) {
  createBulkOrders();
}

module.exports = { createBulkOrders };
