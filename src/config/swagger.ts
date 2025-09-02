// src/config/swagger.ts
import { Options } from "swagger-jsdoc";

export const swaggerOptions: Options = {
  definition: {
    openapi: "3.0.3", // إصدار OpenAPI
    info: {
      title: "بثواني - API Documentation",
      version: "1.0.0",
      description: "توثيق لجميع الـ Endpoints في منصة بثواني",
      contact: {
        name: "فريق بثواني",
        email: "support@bthwani.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "https://api.bthwani.com/api", // ضع هنا الـ Base URL الفعلي
        description: "Production server",
      },
      {
        url: "http://localhost:5000/api", // مسار التطوير المحلي
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // مثال على Schema للمستخدم (يمكنك توسيعها حسب الحاجة)
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "646f3e2b8a3c2b1f88e9d012",
            },
            fullName: {
              type: "string",
              example: "Ahmed Ali",
            },
            aliasName: {
              type: "string",
              example: "AboAhmed",
            },
            email: {
              type: "string",
              example: "ahmed.ali@example.com",
            },
            phone: {
              type: "string",
              example: "+967712345678",
            },
            profileImage: {
              type: "string",
              example: "https://.../avatar.jpg",
            },
            role: {
              type: "string",
              example: "user",
            },
            governorate: {
              type: "string",
              example: "Sana'a",
            },
            city: {
              type: "string",
              example: "Sana'a City",
            },
            isVerified: {
              type: "boolean",
              example: false,
            },
            isBanned: {
              type: "boolean",
              example: false,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2023-05-25T08:23:23.456Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2023-05-25T08:23:23.456Z",
            },
          },
        },
        // يمكنك تعريف المزيد من الـ schemas هنا حسب الحاجة لكل مورد (Resource)
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    tags: [
      { name: "Authentication", description: "عمليات تسجيل الدخول والتسجيل" },
      { name: "Users", description: "إدارة بيانات المستخدمين" },
      { name: "Drivers", description: "إدارة حسابات السائقين" },
      { name: "Vendors", description: "إدارة بيانات البائعين" },
      { name: "Stores", description: "إدارة المتاجر والفروع" },
      { name: "DeliveryProducts", description: "إدارة منتجات وحدة التوصيل" },
      { name: "DeliveryCart", description: "إدارة سلة التسوق للتوصيل" },
      { name: "DeliveryOrders", description: "إدارة طلبات التوصيل النهائية" },
      { name: "DriverReviews", description: "تقييمات المستخدمين للسائقين" },
      { name: "ProductCategories", description: "إدارة فئات منتجات السوق المفتوح" },
      { name: "Products", description: "إدارة منتجات السوق المفتوح" },
      { name: "ProductReports", description: "تقارير المستخدمين عن المنتجات" },
      { name: "BarterRequests", description: "طلبات المقايضة في السوق المفتوح" },
      { name: "Opportunities", description: "إدارة فرص العمل والخدمات" },
      { name: "Bookings", description: "إدارة الحجوزات للمستقلين" },
      { name: "Reviews", description: "مراجعات المستخدمين للمستقلين" },
      { name: "LostFound", description: "إدارة بلاغات المفقود والمعثور عليه" },
      { name: "Messages", description: "إدارة الرسائل بين المستخدمين" },
      { name: "CharityCampaigns", description: "إدارة حملات التبرع الخيري" },
      { name: "Donations", description: "إدارة التبرعات الفردية" },
      { name: "Coupons", description: "إدارة قسائم الخصم" },
      { name: "OrderVendors", description: "إدارة طلبات الشراء في السوق المفتوح" },
      { name: "Favorites", description: "إدارة قائمة المفضلات" },
      { name: "OTPs", description: "إنشاء والتحقق من أكواد OTP" },
      { name: "TopupLogs", description: "سجلات شحن الرصيد للمستخدمين" },
      { name: "AdminLogs", description: "سجلات نشاطات المسؤولين" },
      { name: "WalletTransactions", description: "إدارة المعاملات المالية في المحفظة" },
    ],
  },
  apis: ["./src/routes/**/*.ts", "./src/models/**/*.ts"], // مسارات الملفات التي ستُعلقُ داخلها التعليقات
};
