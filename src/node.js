const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://m775071580:KPU8TxhRilLbgtyB@cluster0.hgb9fu2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
const DeliveryCart = require('./src/models/delivry_Marketplace_V1/DeliveryCart');

(async () => {
  try {
    console.log("🔎 جاري البحث عن السلات المعطوبة...");
    const result = await DeliveryCart.deleteMany({
      $or: [
        { "items.productId": { $exists: false } },
        { "items.productType": { $exists: false } }
      ]
    });
    console.log('✅ تم حذف:', result.deletedCount, 'سلة');
  } catch (e) {
    console.error("❌ خطأ:", e);
  } finally {
    mongoose.connection.close();
  }
})();
