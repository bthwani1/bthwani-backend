import { Router } from 'express';

import * as CategoryController from '../../controllers/marchent/CategoryController';
import * as AttributeController from '../../controllers/marchent/AttributeController';
import * as ProductCatalogController from '../../controllers/marchent/ProductCatalogController';
import * as MerchantProductController from '../../controllers/marchent/MerchantProductController';

const router = Router();

// ---- التصنيفات
router.get('/categories', CategoryController.getAllCategories);
router.get('/categories/:id', CategoryController.getCategoryMacById);
router.post('/categories', CategoryController.addCategoryMac);
router.put('/categories/:id', CategoryController.updateCategoryMac);
router.delete('/categories/:id', CategoryController.deleteCategoryMac);

// ---- السمات
router.get('/attributes', AttributeController.getAllAttributes);
router.get('/attributes/category/:categoryId', AttributeController.getAttributesByCategory);
router.post('/attributes', AttributeController.addAttribute);
router.put('/attributes/:id', AttributeController.updateAttribute);
router.delete('/attributes/:id', AttributeController.deleteAttribute);

// ---- الكاتالوج
router.get('/catalog', ProductCatalogController.getAllProducts);
router.get('/catalog/category/:categoryId', ProductCatalogController.getProductsByCategory);
router.get('/catalog/:id', ProductCatalogController.getProductById);
router.post('/catalog', ProductCatalogController.addProduct);
router.put('/catalog/:id', ProductCatalogController.updateProduct);
router.delete('/catalog/:id', ProductCatalogController.deleteProduct);

// ---- منتجات التاجر (تم إرسالها في رسالة سابقة)
// .. بقية المسارات لمنتجات التاجر
router.get('/merchant-products', MerchantProductController.getAllMerchantProducts);

// --- منتجات تاجر فقط
router.get('/merchant-products/merchant/:merchantId', MerchantProductController.getMerchantProductsByMerchant);

// --- منتجات تاجر في تصنيف محدد
router.get('/merchant-products/merchant/:merchantId/category/:categoryId', MerchantProductController.getMerchantProductsByCategory);

// --- منتج تاجر مفرد (للعرض أو التعديل)
router.get('/merchant-products/:id', MerchantProductController.getMerchantProductById);

// --- إضافة منتج تاجر
router.post('/merchant-products', MerchantProductController.addMerchantProduct);

// --- تحديث منتج تاجر
router.put('/merchant-products/:id', MerchantProductController.updateMerchantProduct);

// --- حذف منتج تاجر
router.delete('/merchant-products/:id', MerchantProductController.deleteMerchantProduct);
export default router;
