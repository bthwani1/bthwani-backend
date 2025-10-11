// src/bootstrap/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// تعريفات عامة قابلة لإعادة الاستخدام
export const commonSchemas = {
  QueryParams: {
    type: 'object',
    properties: {
      q: {
        type: 'string',
        description: 'نص البحث (search query)',
        example: 'مطعم'
      },
      page: {
        type: 'integer',
        minimum: 1,
        description: 'رقم الصفحة',
        example: 1
      },
      perPage: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        description: 'عدد العناصر في الصفحة (افتراضي 20)',
        example: 20
      },
      sort: {
        type: 'string',
        description: 'ترتيب البيانات (مثال: createdAt:desc,name:asc)',
        example: 'createdAt:desc'
      },
      filters: {
        type: 'string',
        description: 'فلاتر إضافية بتنسيق JSON أو مختصر (مثال: status:active)',
        example: '{"status": "active", "category": "food"}'
      }
    }
  },
  PaginatedResponse: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        description: 'قائمة العناصر'
      },
      pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          pages: { type: 'integer' }
        }
      },
      meta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          per_page: { type: 'integer' },
          total: { type: 'integer' },
          returned: { type: 'integer' }
        }
      }
    }
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      error: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'رمز الخطأ البرمجي',
            example: 'VALIDATION_FAILED'
          },
          message: {
            type: 'string',
            description: 'رسالة الخطأ',
            example: 'Validation failed'
          }
        }
      },
      detail: {
        type: 'object',
        description: 'تفاصيل إضافية للخطأ'
      }
    }
  },
  // إضافة تعريفات إضافية للـ API
  User: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '60f1b2b3c4d5e6f7g8h9i0j1'
      },
      fullName: {
        type: 'string',
        example: 'محمد أحمد'
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'user@example.com'
      },
      phone: {
        type: 'string',
        example: '+966501234567'
      },
      firebaseUID: {
        type: 'string',
        example: 'firebase_user_id'
      },
      role: {
        type: 'string',
        enum: ['user', 'driver', 'vendor', 'marketer', 'admin', 'super_admin'],
        example: 'user'
      },
      status: {
        type: 'string',
        enum: ['active', 'inactive', 'suspended', 'pending'],
        example: 'active'
      },
      emailVerified: {
        type: 'boolean',
        example: true
      },
      phoneVerified: {
        type: 'boolean',
        example: false
      },
      avatar: {
        type: 'string',
        example: 'https://example.com/avatar.jpg'
      },
      addresses: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Address'
        }
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T10:30:00.000Z'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T10:30:00.000Z'
      }
    }
  },
  Address: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '60f1b2b3c4d5e6f7g8h9i0j2'
      },
      type: {
        type: 'string',
        enum: ['home', 'work', 'other'],
        example: 'home'
      },
      title: {
        type: 'string',
        example: 'المنزل'
      },
      city: {
        type: 'string',
        example: 'الرياض'
      },
      street: {
        type: 'string',
        example: 'شارع الملك فهد'
      },
      building: {
        type: 'string',
        example: 'عمارة 123'
      },
      apartment: {
        type: 'string',
        example: 'شقة 45'
      },
      coordinates: {
        type: 'object',
        properties: {
          lat: {
            type: 'number',
            example: 24.7136
          },
          lng: {
            type: 'number',
            example: 46.6753
          }
        }
      },
      isDefault: {
        type: 'boolean',
        example: true
      }
    }
  },
  Order: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '60f1b2b3c4d5e6f7g8h9i0j3'
      },
      orderNumber: {
        type: 'string',
        example: 'ORD-20240115-001'
      },
      user: {
        $ref: '#/components/schemas/User'
      },
      driver: {
        $ref: '#/components/schemas/Driver'
      },
      store: {
        $ref: '#/components/schemas/Store'
      },
      status: {
        type: 'string',
        enum: ['pending_confirmation', 'under_review', 'preparing', 'assigned', 'out_for_delivery', 'delivered', 'returned', 'awaiting_procurement', 'procured', 'procurement_failed', 'cancelled'],
        example: 'delivered'
      },
      paymentMethod: {
        type: 'string',
        enum: ['cash', 'card', 'wallet', 'cod', 'mixed'],
        example: 'cash'
      },
      totalAmount: {
        type: 'number',
        example: 125.50
      },
      deliveryFee: {
        type: 'number',
        example: 15.00
      },
      items: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/OrderItem'
        }
      },
      address: {
        $ref: '#/components/schemas/Address'
      },
      notes: {
        type: 'string',
        example: 'تعليمات خاصة للتوصيل'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T10:30:00.000Z'
      },
      deliveredAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T11:45:00.000Z'
      }
    }
  },
  OrderItem: {
    type: 'object',
    properties: {
      productType: {
        type: 'string',
        enum: ['merchantProduct', 'deliveryProduct'],
        example: 'deliveryProduct'
      },
      product: {
        type: 'string',
        example: '60f1b2b3c4d5e6f7g8h9i0j4'
      },
      quantity: {
        type: 'integer',
        example: 2
      },
      price: {
        type: 'number',
        example: 25.00
      },
      customizations: {
        type: 'array',
        items: {
          type: 'string'
        },
        example: ['حار جداً', 'بدون بصل']
      }
    }
  },
  Driver: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '60f1b2b3c4d5e6f7g8h9i0j5'
      },
      fullName: {
        type: 'string',
        example: 'أحمد محمد'
      },
      phone: {
        type: 'string',
        example: '+966501234568'
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'driver@example.com'
      },
      status: {
        type: 'string',
        enum: ['active', 'inactive', 'busy', 'offline', 'on_vacation'],
        example: 'active'
      },
      vehicleType: {
        type: 'string',
        enum: ['car', 'motorcycle', 'bicycle', 'truck'],
        example: 'car'
      },
      licensePlate: {
        type: 'string',
        example: 'ABC 123'
      },
      currentLocation: {
        type: 'object',
        properties: {
          lat: {
            type: 'number',
            example: 24.7136
          },
          lng: {
            type: 'number',
            example: 46.6753
          }
        }
      },
      rating: {
        type: 'number',
        minimum: 0,
        maximum: 5,
        example: 4.5
      }
    }
  },
  Store: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '60f1b2b3c4d5e6f7g8h9i0j6'
      },
      name: {
        type: 'string',
        example: 'مطعم الرياض'
      },
      description: {
        type: 'string',
        example: 'مطعم متخصص في المأكولات العربية'
      },
      logo: {
        type: 'string',
        example: 'https://example.com/logo.jpg'
      },
      banner: {
        type: 'string',
        example: 'https://example.com/banner.jpg'
      },
      category: {
        type: 'string',
        example: 'مطاعم'
      },
      phone: {
        type: 'string',
        example: '+966501234569'
      },
      address: {
        $ref: '#/components/schemas/Address'
      },
      owner: {
        type: 'string',
        example: '60f1b2b3c4d5e6f7g8h9i0j7'
      },
      status: {
        type: 'string',
        enum: ['active', 'inactive', 'pending', 'suspended'],
        example: 'active'
      },
      rating: {
        type: 'number',
        minimum: 0,
        maximum: 5,
        example: 4.2
      },
      openingHours: {
        type: 'object',
        properties: {
          monday: {
            type: 'object',
            properties: {
              open: { type: 'string', example: '08:00' },
              close: { type: 'string', example: '23:00' },
              closed: { type: 'boolean', example: false }
            }
          }
        }
      }
    }
  },
  Product: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '60f1b2b3c4d5e6f7g8h9i0j8' },
      name: { type: 'string', example: 'برجر لحم بقري' },
      description: { type: 'string', example: 'برجر لحم طازج مع خضروات' },
      price: { type: 'number', example: 25.50 },
      image: { type: 'string', example: 'https://example.com/product.jpg' },
      category: { type: 'string', example: 'الوجبات الرئيسية' },
      isAvailable: { type: 'boolean', example: true },
      preparationTime: { type: 'integer', example: 15 },
      calories: { type: 'integer', example: 450 },
      ingredients: {
        type: 'array',
        items: { type: 'string' },
        example: ['لحم بقري', 'خس', 'طماطم', 'خبز']
      },
      customizations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'مستوى النضج' },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'نصف استواء' },
                  price: { type: 'number', example: 0 }
                }
              }
            },
            required: { type: 'boolean', example: true }
          }
        }
      },
      store: { type: 'string', example: '60f1b2b3c4d5e6f7g8h9i0j6' },
      rating: { type: 'number', minimum: 0, maximum: 5, example: 4.2 },
      totalOrders: { type: 'integer', example: 150 }
    }
  },
  DeliveryOrder: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '60f1b2b3c4d5e6f7g8h9i0j9' },
      orderNumber: { type: 'string', example: 'ORD-20240115-001' },
      user: { $ref: '#/components/schemas/User' },
      driver: { $ref: '#/components/schemas/Driver' },
      store: { $ref: '#/components/schemas/Store' },
      status: {
        type: 'string',
        enum: ['pending_confirmation', 'under_review', 'preparing', 'assigned', 'out_for_delivery', 'delivered', 'returned', 'awaiting_procurement', 'procured', 'procurement_failed', 'cancelled'],
        example: 'out_for_delivery'
      },
      paymentMethod: {
        type: 'string',
        enum: ['cash', 'card', 'wallet', 'cod', 'mixed'],
        example: 'cash'
      },
      totalAmount: { type: 'number', example: 125.50 },
      deliveryFee: { type: 'number', example: 15.00 },
      tax: { type: 'number', example: 8.75 },
      discount: { type: 'number', example: 10.00 },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            productType: {
              type: 'string',
              enum: ['merchantProduct', 'deliveryProduct']
            },
            product: { type: 'string' },
            quantity: { type: 'integer', example: 2 },
            price: { type: 'number', example: 25.00 },
            customizations: {
              type: 'array',
              items: { type: 'string' },
              example: ['حار جداً', 'بدون مايونيز']
            },
            notes: { type: 'string', example: 'بدون ملح إضافي' }
          }
        }
      },
      address: { $ref: '#/components/schemas/Address' },
      notes: { type: 'string', example: 'تعليمات خاصة للتوصيل' },
      estimatedDeliveryTime: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T15:30:00.000Z'
      },
      actualDeliveryTime: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T15:25:00.000Z'
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  Cart: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      user: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            productType: { type: 'string', enum: ['merchantProduct', 'deliveryProduct'] },
            product: { type: 'string' },
            quantity: { type: 'integer' },
            price: { type: 'number' },
            customizations: { type: 'array', items: { type: 'string' } },
            store: { type: 'string' }
          }
        }
      },
      subtotal: { type: 'number' },
      deliveryFee: { type: 'number' },
      tax: { type: 'number' },
      discount: { type: 'number' },
      total: { type: 'number' },
      estimatedDeliveryTime: { type: 'integer', example: 45 },
      isValid: { type: 'boolean' },
      expiresAt: { type: 'string', format: 'date-time' }
    }
  }
};

// إعدادات Swagger المحدثة مع تعريفات شاملة
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'bThwani API Documentation',
      version: '1.0.0',
      description: `
        # bThwani Platform API

        نظام شامل للتجارة الإلكترونية والتوصيل في المملكة العربية السعودية

        ## الميزات الرئيسية:
        - **إدارة المستخدمين**: نظام شامل لإدارة المستخدمين والصلاحيات
        - **سوق التوصيل**: نظام متقدم للطلبات والتوصيل
        - **إدارة السائقين**: تتبع السائقين وإدارة المهام
        - **إدارة التجار**: نظام شامل لإدارة التجار والمتاجر
        - **المحفظة المالية**: نظام دفع متكامل
        - **نظام الموظفين**: إدارة الموارد البشرية
        - **التسويق والميداني**: إدارة الحملات التسويقية
        - **الدعم الفني**: نظام متكامل لخدمة العملاء

        ## التقنيات المستخدمة:
        - **Backend**: Node.js, Express.js, TypeScript
        - **Database**: MongoDB with Mongoose ODM
        - **Authentication**: Firebase Authentication + JWT
        - **Real-time**: Socket.IO
        - **Documentation**: Swagger/OpenAPI 3.0

        ## الخوادم:
        - **Development**: http://localhost:3001/api/v1
        - **Staging**: https://staging-api.bthwani.com/api/v1
        - **Production**: https://api.bthwani.com/api/v1
      `,
      contact: {
        name: 'bThwani Development Team',
        email: 'dev@bthwani.com',
        url: 'https://bthwani.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://api.bthwani.com/api/v1'
          : process.env.NODE_ENV === 'staging'
          ? 'https://staging-api.bthwani.com/api/v1'
          : 'http://localhost:3001/api/v1',
        description: process.env.NODE_ENV === 'production'
          ? 'Production server'
          : process.env.NODE_ENV === 'staging'
          ? 'Staging server'
          : 'Development server',
      },
    ],
    components: {
      schemas: commonSchemas,
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in format: Bearer {token}'
        },
        FirebaseAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Firebase',
          description: 'Firebase Authentication token'
        },
        VendorAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Vendor-specific JWT token'
        },
        MarketerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Marketer-specific JWT token'
        }
      },
      parameters: {
        PaginationParams: {
          in: 'query',
          name: 'pagination',
          schema: {
            type: 'object',
            properties: {
              page: {
                type: 'integer',
                minimum: 1,
                default: 1,
                description: 'رقم الصفحة'
              },
              perPage: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 20,
                description: 'عدد العناصر في الصفحة'
              }
            }
          }
        },
        SearchParam: {
          in: 'query',
          name: 'q',
          schema: {
            type: 'string',
            description: 'نص البحث'
          }
        },
        SortParam: {
          in: 'query',
          name: 'sort',
          schema: {
            type: 'string',
            description: 'ترتيب البيانات (مثال: createdAt:desc,name:asc)',
            example: 'createdAt:desc'
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'غير مصرح لك بالوصول',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                error: {
                  code: 'AUTHENTICATION_REQUIRED',
                  message: 'Authentication required'
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'ليس لديك صلاحية للوصول لهذا المورد',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                error: {
                  code: 'INSUFFICIENT_PERMISSIONS',
                  message: 'Insufficient permissions'
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'المورد المطلوب غير موجود',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                error: {
                  code: 'RESOURCE_NOT_FOUND',
                  message: 'Resource not found'
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'البيانات المرسلة غير صالحة',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                error: {
                  code: 'VALIDATION_FAILED',
                  message: 'Validation failed'
                },
                detail: {
                  fields: {
                    email: ['Email is required'],
                    phone: ['Phone number is invalid']
                  }
                }
              }
            }
          }
        },
        ServerError: {
          description: 'خطأ داخلي في الخادم',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                error: {
                  code: 'INTERNAL_SERVER_ERROR',
                  message: 'Internal server error'
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints for user authentication and authorization'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints (requires admin privileges)'
      },
      {
        name: 'Delivery',
        description: 'Delivery marketplace endpoints'
      },
      {
        name: 'Orders',
        description: 'Order management endpoints'
      },
      {
        name: 'Drivers',
        description: 'Driver management endpoints'
      },
      {
        name: 'Vendors',
        description: 'Vendor management endpoints'
      },
      {
        name: 'Wallet',
        description: 'Wallet and financial services endpoints'
      },
      {
        name: 'Marketing',
        description: 'Marketing and field operations endpoints'
      },
      {
        name: 'Support',
        description: 'Customer support endpoints'
      },
      {
        name: 'Notifications',
        description: 'Notification management endpoints'
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting endpoints'
      }
    ]
  },
  apis: [
    './src/routes/**/*.ts',
    './src/controllers/**/*.ts',
  ],
};

// إضافة مسارات المصادقة بالتفصيل
export const authPaths = {
  '/api/v1/auth/refresh': {
    post: {
      tags: ['Authentication'],
      summary: 'تحديث توكن الوصول باستخدام توكن التحديث',
      description: `
        نقطة نهاية آمنة لتحديث توكن الوصول باستخدام توكن التحديث.
        يتم في هذه العملية:
        1. التحقق من صحة توكن التحديث
        2. التحقق من عدم وجود التوكن في القائمة السوداء
        3. إنشاء توكن وصول وتحديث جديدين
        4. إضافة التوكن القديم إلى القائمة السوداء
        5. حفظ توكن التحديث الجديد
      `,
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: {
                refreshToken: {
                  type: 'string',
                  description: 'توكن التحديث المُستلم من تسجيل الدخول',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                }
              }
            },
            example: {
              refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGYxYjJiM2M0ZDVlNmY3ZzhIOWkwajEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTY0NDU2NzI5OCwiZXhwIjoxNjQ1MTcyMDk4fQ.signature'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم تحديث التوكنات بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  accessToken: {
                    type: 'string',
                    description: 'توكن الوصول الجديد',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                  },
                  refreshToken: {
                    type: 'string',
                    description: 'توكن التحديث الجديد',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                  },
                  expiresIn: {
                    type: 'string',
                    description: 'مدة صلاحية توكن الوصول',
                    example: '15m'
                  }
                }
              },
              example: {
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGYxYjJiM2M0ZDVlNmY3ZzhIOWkwajEiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNjQ0NTY3Mjk4LCJleHAiOjE2NDQ1NjgxOTh9.signature',
                refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGYxYjJiM2M0ZDVlNmY3ZzhIOWkwajEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTY0NDU2NzI5OCwiZXhwIjoxNjQ1MTcyMDk4fQ.signature',
                expiresIn: '15m'
              }
            }
          }
        },
        401: {
          description: 'خطأ في المصادقة أو التوكنات',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                'missing-token': {
                  summary: 'توكن التحديث مفقود',
                  value: {
                    error: {
                      code: 'REFRESH_TOKEN_REQUIRED',
                      message: 'Refresh token is required'
                    }
                  }
                },
                'invalid-token': {
                  summary: 'توكن التحديث غير صالح',
                  value: {
                    error: {
                      code: 'INVALID_REFRESH_TOKEN',
                      message: 'Invalid refresh token'
                    }
                  }
                },
                'blacklisted-token': {
                  summary: 'التوكن في القائمة السوداء',
                  value: {
                    error: {
                      code: 'BLACKLISTED_TOKEN',
                      message: 'Token has been blacklisted'
                    }
                  }
                },
                'user-not-found': {
                  summary: 'المستخدم غير موجود',
                  value: {
                    error: {
                      code: 'USER_NOT_FOUND',
                      message: 'User not found'
                    }
                  }
                },
                'user-inactive': {
                  summary: 'حساب المستخدم غير نشط',
                  value: {
                    error: {
                      code: 'USER_INACTIVE',
                      message: 'User account is inactive'
                    }
                  }
                }
              }
            }
          }
        },
        500: {
          description: 'خطأ داخلي في الخادم',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'Failed to refresh token'
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/v1/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'تسجيل الخروج وإبطال التوكنات',
      description: `
        نقطة نهاية لتسجيل الخروج وإبطال التوكنات الحالية.
        يتم في هذه العملية:
        1. إضافة توكن الوصول إلى القائمة السوداء
        2. إضافة توكن التحديث إلى القائمة السوداء (إذا تم توفيره)
        3. إنهاء الجلسة الحالية
      `,
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                refreshToken: {
                  type: 'string',
                  description: 'توكن التحديث لإبطاله (اختياري)',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                }
              }
            },
            example: {
              refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGYxYjJiM2M0ZDVlNmY3ZzhIOWkwajEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTY0NDU2NzI5OCwiZXhwIjoxNjQ1MTcyMDk4fQ.signature'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم تسجيل الخروج بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Logged out successfully'
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'توكن الوصول غير صالح أو منتهي الصلاحية',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        500: {
          description: 'خطأ داخلي في الخادم',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'Failed to logout'
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/v1/users/otp/send': {
    post: {
      tags: ['Authentication', 'OTP'],
      summary: 'إرسال رمز التحقق عبر قناة محددة',
      description: `
        إرسال رمز تحقق مؤقت (OTP) عبر القنوات المتاحة:
        - **email**: إرسال عبر البريد الإلكتروني
        - **sms**: إرسال عبر الرسائل النصية
        - **whatsapp**: إرسال عبر واتساب

        يتم حفظ رمز التحقق في قاعدة البيانات مع تاريخ انتهاء الصلاحية.
      `,
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['channel', 'purpose'],
              properties: {
                channel: {
                  type: 'string',
                  enum: ['email', 'sms', 'whatsapp'],
                  description: 'قناة إرسال رمز التحقق',
                  example: 'email'
                },
                purpose: {
                  type: 'string',
                  enum: ['verifyEmail', 'resetPassword', 'twoFactor'],
                  description: 'الغرض من رمز التحقق',
                  example: 'verifyEmail'
                }
              }
            },
            example: {
              channel: 'email',
              purpose: 'verifyEmail'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم إرسال رمز التحقق بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ok: {
                    type: 'boolean',
                    example: true
                  },
                  devCode: {
                    type: 'string',
                    description: 'رمز التحقق (يظهر فقط في بيئة التطوير)',
                    example: '123456'
                  }
                }
              },
              example: {
                ok: true,
                devCode: '123456'
              }
            }
          }
        },
        400: {
          description: 'بيانات الطلب غير صالحة',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                'invalid-channel': {
                  summary: 'قناة غير مدعومة',
                  value: {
                    ok: false,
                    message: 'قناة غير مدعومة'
                  }
                },
                'missing-phone': {
                  summary: 'رقم الهاتف مطلوب للواتساب/الرسائل',
                  value: {
                    ok: false,
                    message: 'رقم الهاتف مطلوب لإرسال عبر الواتساب/الرسائل'
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        404: {
          description: 'المستخدم غير موجود',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                ok: false,
                message: 'المستخدم غير موجود'
              }
            }
          }
        },
        500: {
          description: 'خطأ في إرسال رمز التحقق',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                ok: false,
                message: 'فشل الإرسال'
              }
            }
          }
        }
      }
    }
  },
  '/api/v1/users/otp/verify': {
    post: {
      tags: ['Authentication', 'OTP'],
      summary: 'التحقق من صحة رمز OTP',
      description: `
        التحقق من صحة رمز OTP المُرسل سابقاً.
        يتم في هذه العملية:
        1. التحقق من وجود رمز التحقق في قاعدة البيانات
        2. التحقق من عدم استخدام الرمز سابقاً
        3. التحقق من عدم انتهاء صلاحية الرمز
        4. تحديث حالة المستخدم حسب الغرض من الرمز
      `,
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code'],
              properties: {
                code: {
                  type: 'string',
                  minLength: 6,
                  maxLength: 6,
                  description: 'رمز التحقق المكون من 6 أرقام',
                  example: '123456'
                }
              }
            },
            example: {
              code: '123456'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم التحقق من الرمز بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ok: {
                    type: 'boolean',
                    example: true
                  },
                  verified: {
                    type: 'boolean',
                    example: true
                  },
                  code: {
                    type: 'string',
                    example: 'VERIFIED'
                  }
                }
              },
              example: {
                ok: true,
                verified: true,
                code: 'VERIFIED'
              }
            }
          }
        },
        400: {
          description: 'رمز التحقق غير صالح أو البيانات غير مكتملة',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                'invalid-code': {
                  summary: 'رمز التحقق مطلوب',
                  value: {
                    ok: false,
                    code: 'BAD_CODE',
                    message: 'رمز التحقق مطلوب'
                  }
                },
                'invalid-otp': {
                  summary: 'رمز التحقق غير صحيح أو منتهي الصلاحية',
                  value: {
                    ok: false,
                    code: 'BAD_OTP',
                    message: 'رمز غير صحيح أو منتهي'
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        404: {
          description: 'المستخدم غير موجود',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                ok: false,
                message: 'المستخدم غير موجود'
              }
            }
          }
        },
        500: {
          description: 'خطأ في عملية التحقق',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                ok: false,
                message: 'فشل التحقق'
              }
            }
          }
        }
      }
    }
  }
};

// إضافة مسارات إدارة المستخدمين بالتفصيل
export const userManagementPaths = {
  '/api/v1/users/me': {
    get: {
      tags: ['Users'],
      summary: 'الحصول على معلومات المستخدم الحالي',
      description: `
        استرجاع معلومات المستخدم الحالي المُسجل دخوله.
        يتضمن هذا الطلب جميع البيانات الأساسية للمستخدم مثل:
        - المعلومات الشخصية (الاسم، البريد الإلكتروني، رقم الهاتف)
        - حالة الحساب (نشط، غير نشط، معلق)
        - حالة التحقق (البريد الإلكتروني، رقم الهاتف)
        - قائمة العناوين المحفوظة
        - إحصائيات المستخدم
      `,
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'تم استرجاع معلومات المستخدم بنجاح',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' },
              example: {
                _id: '60f1b2b3c4d5e6f7g8h9i0j1',
                fullName: 'محمد أحمد علي',
                email: 'user@example.com',
                phone: '+966501234567',
                firebaseUID: 'firebase_user_123',
                role: 'user',
                status: 'active',
                emailVerified: true,
                phoneVerified: false,
                avatar: 'https://example.com/avatar.jpg',
                addresses: [
                  {
                    _id: '60f1b2b3c4d5e6f7g8h9i0j2',
                    type: 'home',
                    title: 'المنزل الرئيسي',
                    city: 'الرياض',
                    street: 'شارع الملك فهد',
                    building: 'عمارة 123',
                    apartment: 'شقة 45',
                    coordinates: {
                      lat: 24.7136,
                      lng: 46.6753
                    },
                    isDefault: true
                  }
                ],
                createdAt: '2024-01-15T10:30:00.000Z',
                updatedAt: '2024-01-15T10:30:00.000Z'
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول - توكن غير صالح',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/api/v1/users/profile': {
    patch: {
      tags: ['Users'],
      summary: 'تحديث الملف الشخصي للمستخدم',
      description: `
        تحديث المعلومات الشخصية للمستخدم الحالي.
        يمكن تحديث:
        - الاسم الكامل
        - رقم الهاتف
        - تاريخ الميلاد
        - الجنس
        - اللغة المفضلة
        - إعدادات الخصوصية
      `,
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                fullName: {
                  type: 'string',
                  minLength: 2,
                  maxLength: 100,
                  description: 'الاسم الكامل للمستخدم',
                  example: 'أحمد محمد علي'
                },
                phone: {
                  type: 'string',
                  pattern: '^\\+966[0-9]{9}$',
                  description: 'رقم الهاتف السعودي',
                  example: '+966501234567'
                },
                dateOfBirth: {
                  type: 'string',
                  format: 'date',
                  description: 'تاريخ الميلاد',
                  example: '1990-01-01'
                },
                gender: {
                  type: 'string',
                  enum: ['male', 'female'],
                  description: 'الجنس',
                  example: 'male'
                },
                preferredLanguage: {
                  type: 'string',
                  enum: ['ar', 'en'],
                  description: 'اللغة المفضلة',
                  example: 'ar'
                },
                privacySettings: {
                  type: 'object',
                  properties: {
                    showPhoneNumber: {
                      type: 'boolean',
                      description: 'إظهار رقم الهاتف للتجار',
                      example: false
                    },
                    showEmail: {
                      type: 'boolean',
                      description: 'إظهار البريد الإلكتروني',
                      example: false
                    },
                    allowNotifications: {
                      type: 'boolean',
                      description: 'السماح بالإشعارات',
                      example: true
                    }
                  }
                }
              }
            },
            example: {
              fullName: 'أحمد محمد علي السعد',
              phone: '+966501234567',
              dateOfBirth: '1990-01-01',
              gender: 'male',
              preferredLanguage: 'ar',
              privacySettings: {
                showPhoneNumber: false,
                showEmail: false,
                allowNotifications: true
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم تحديث الملف الشخصي بنجاح',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' }
            }
          }
        },
        400: {
          description: 'بيانات الطلب غير صالحة',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/api/v1/users/address': {
    get: {
      tags: ['Users', 'Addresses'],
      summary: 'استرجاع عناوين المستخدم المحفوظة',
      description: 'الحصول على قائمة بجميع العناوين المحفوظة للمستخدم الحالي',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'type',
          schema: {
            type: 'string',
            enum: ['home', 'work', 'other']
          },
          description: 'تصفية حسب نوع العنوان'
        }
      ],
      responses: {
        200: {
          description: 'تم استرجاع العناوين بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  addresses: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Address' }
                  },
                  total: {
                    type: 'integer',
                    description: 'إجمالي عدد العناوين'
                  }
                }
              },
              example: {
                addresses: [
                  {
                    _id: '60f1b2b3c4d5e6f7g8h9i0j2',
                    type: 'home',
                    title: 'المنزل الرئيسي',
                    city: 'الرياض',
                    street: 'شارع الملك فهد',
                    building: 'عمارة 123',
                    apartment: 'شقة 45',
                    coordinates: {
                      lat: 24.7136,
                      lng: 46.6753
                    },
                    isDefault: true
                  },
                  {
                    _id: '60f1b2b3c4d5e6f7g8h9i0j3',
                    type: 'work',
                    title: 'مكتب العمل',
                    city: 'جدة',
                    street: 'شارع التحرير',
                    building: 'برج التجارة',
                    apartment: 'الدور 15',
                    coordinates: {
                      lat: 21.5433,
                      lng: 39.1728
                    },
                    isDefault: false
                  }
                ],
                total: 2
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    post: {
      tags: ['Users', 'Addresses'],
      summary: 'إضافة عنوان جديد للمستخدم',
      description: 'إضافة عنوان جديد إلى قائمة عناوين المستخدم المحفوظة',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'title', 'city', 'street'],
              properties: {
                type: {
                  type: 'string',
                  enum: ['home', 'work', 'other'],
                  description: 'نوع العنوان'
                },
                title: {
                  type: 'string',
                  maxLength: 50,
                  description: 'عنوان وصفي للمكان'
                },
                city: {
                  type: 'string',
                  description: 'اسم المدينة'
                },
                street: {
                  type: 'string',
                  description: 'اسم الشارع'
                },
                building: {
                  type: 'string',
                  description: 'رقم العمارة أو اسم المبنى'
                },
                apartment: {
                  type: 'string',
                  description: 'رقم الشقة أو رقم الوحدة'
                },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number' },
                    lng: { type: 'number' }
                  }
                },
                isDefault: {
                  type: 'boolean',
                  description: 'تعيين كعنوان افتراضي'
                }
              }
            },
            example: {
              type: 'home',
              title: 'المنزل الجديد',
              city: 'الرياض',
              street: 'شارع الملك عبدالعزيز',
              building: 'مجمع الواحة السكني',
              apartment: 'فيلا 25',
              coordinates: {
                lat: 24.7136,
                lng: 46.6753
              },
              isDefault: false
            }
          }
        }
      },
      responses: {
        201: {
          description: 'تم إضافة العنوان بنجاح',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Address' }
            }
          }
        },
        400: {
          description: 'بيانات العنوان غير صالحة',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/api/v1/users/wallet': {
    get: {
      tags: ['Users', 'Wallet'],
      summary: 'استرجاع معلومات المحفظة الرقمية',
      description: `
        الحصول على معلومات المحفظة الرقمية للمستخدم:
        - الرصيد الحالي
        - نوع العملة
        - حالة المحفظة
        - تاريخ آخر تحديث
        - حدود السحب والإيداع
      `,
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'تم استرجاع معلومات المحفظة بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  user: { type: 'string' },
                  balance: {
                    type: 'number',
                    description: 'الرصيد الحالي بالريال السعودي',
                    example: 150.75
                  },
                  currency: {
                    type: 'string',
                    example: 'SAR'
                  },
                  status: {
                    type: 'string',
                    enum: ['active', 'frozen', 'suspended'],
                    example: 'active'
                  },
                  dailyLimit: {
                    type: 'number',
                    description: 'الحد اليومي للسحب',
                    example: 1000.00
                  },
                  monthlyLimit: {
                    type: 'number',
                    description: 'الحد الشهري للسحب',
                    example: 5000.00
                  },
                  lastTransaction: {
                    type: 'string',
                    format: 'date-time',
                    description: 'تاريخ آخر معاملة'
                  },
                  createdAt: {
                    type: 'string',
                    format: 'date-time'
                  },
                  updatedAt: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              },
              example: {
                _id: '60f1b2b3c4d5e6f7g8h9i0j4',
                user: '60f1b2b3c4d5e6f7g8h9i0j1',
                balance: 150.75,
                currency: 'SAR',
                status: 'active',
                dailyLimit: 1000.00,
                monthlyLimit: 5000.00,
                lastTransaction: '2024-01-15T14:30:00.000Z',
                createdAt: '2024-01-01T10:00:00.000Z',
                updatedAt: '2024-01-15T14:30:00.000Z'
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        404: {
          description: 'المحفظة غير موجودة',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                error: {
                  code: 'WALLET_NOT_FOUND',
                  message: 'Wallet not found'
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/v1/users/notifications': {
    get: {
      tags: ['Users', 'Notifications'],
      summary: 'استرجاع إشعارات المستخدم',
      description: `
        استرجاع قائمة بإشعارات المستخدم مع إمكانية التصفية:
        - الإشعارات غير المقروءة فقط
        - إشعارات من نوع محدد
        - ترتيب حسب التاريخ
        - تحديد عدد النتائج
      `,
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'unreadOnly',
          schema: { type: 'boolean' },
          description: 'إرجاع الإشعارات غير المقروءة فقط'
        },
        {
          in: 'query',
          name: 'type',
          schema: {
            type: 'string',
            enum: ['order', 'promotion', 'system', 'wallet']
          },
          description: 'تصفية حسب نوع الإشعار'
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 50,
            default: 20
          },
          description: 'عدد النتائج المطلوبة'
        },
        {
          in: 'query',
          name: 'offset',
          schema: {
            type: 'integer',
            minimum: 0,
            default: 0
          },
          description: 'عدد النتائج المُتجاهلة'
        }
      ],
      responses: {
        200: {
          description: 'تم استرجاع الإشعارات بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notifications: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        title: { type: 'string' },
                        message: { type: 'string' },
                        type: {
                          type: 'string',
                          enum: ['order', 'promotion', 'system', 'wallet']
                        },
                        isRead: { type: 'boolean' },
                        data: { type: 'object' },
                        createdAt: { type: 'string', format: 'date-time' }
                      }
                    }
                  },
                  total: { type: 'integer' },
                  unread: { type: 'integer' }
                }
              },
              example: {
                notifications: [
                  {
                    _id: '60f1b2b3c4d5e6f7g8h9i0j5',
                    title: 'طلبك جاهز للاستلام',
                    message: 'طلبك رقم ORD-20240115-001 أصبح جاهزاً للاستلام من السائق',
                    type: 'order',
                    isRead: false,
                    data: {
                      orderId: '60f1b2b3c4d5e6f7g8h9i0j6',
                      orderNumber: 'ORD-20240115-001'
                    },
                    createdAt: '2024-01-15T14:30:00.000Z'
                  },
                  {
                    _id: '60f1b2b3c4d5e6f7g8h9i0j7',
                    title: 'خصم خاص لك',
                    message: 'احصل على خصم 20% على طلبك التالي باستخدام كود SAVE20',
                    type: 'promotion',
                    isRead: true,
                    data: {
                      couponCode: 'SAVE20',
                      discount: 20
                    },
                    createdAt: '2024-01-15T12:00:00.000Z'
                  }
                ],
                total: 15,
                unread: 3
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  }
};

// إضافة مسارات سوق التوصيل بالتفصيل
export const deliveryMarketplacePaths = {
  '/api/v1/delivery/order': {
    post: {
      tags: ['Delivery', 'Orders'],
      summary: 'إنشاء طلب توصيل جديد',
      description: `
        إنشاء طلب توصيل جديد مع إمكانية طلب منتجات من متاجر مختلفة.
        يتضمن هذا الطلب:
        1. التحقق من صحة المنتجات والمتاجر
        2. حساب التكلفة الإجمالية (منتجات + توصيل + ضريبة)
        3. تطبيق الخصومات والعروض
        4. إنشاء رقم طلب فريد
        5. إشعار المتاجر والسائقين
      `,
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['items', 'address', 'paymentMethod'],
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['productType', 'product', 'quantity'],
                    properties: {
                      productType: {
                        type: 'string',
                        enum: ['merchantProduct', 'deliveryProduct']
                      },
                      product: { type: 'string' },
                      quantity: { type: 'integer', minimum: 1 },
                      customizations: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      notes: { type: 'string' }
                    }
                  },
                  minItems: 1
                },
                address: {
                  type: 'object',
                  required: ['city', 'street', 'coordinates'],
                  properties: {
                    city: { type: 'string' },
                    street: { type: 'string' },
                    building: { type: 'string' },
                    apartment: { type: 'string' },
                    coordinates: {
                      type: 'object',
                      required: ['lat', 'lng'],
                      properties: {
                        lat: { type: 'number' },
                        lng: { type: 'number' }
                      }
                    }
                  }
                },
                paymentMethod: {
                  type: 'string',
                  enum: ['cash', 'card', 'wallet', 'cod', 'mixed']
                },
                notes: { type: 'string' },
                couponCode: { type: 'string' },
                scheduledDelivery: {
                  type: 'object',
                  properties: {
                    date: { type: 'string', format: 'date' },
                    timeSlot: { type: 'string' }
                  }
                }
              }
            },
            example: {
              items: [
                {
                  productType: 'deliveryProduct',
                  product: '60f1b2b3c4d5e6f7g8h9i0j8',
                  quantity: 2,
                  customizations: ['حار جداً', 'بدون مايونيز'],
                  notes: 'بدون ملح إضافي'
                }
              ],
              address: {
                city: 'الرياض',
                street: 'شارع الملك فهد',
                building: 'عمارة 123',
                apartment: 'شقة 45',
                coordinates: {
                  lat: 24.7136,
                  lng: 46.6753
                }
              },
              paymentMethod: 'cash',
              notes: 'تعليمات خاصة للتوصيل',
              couponCode: 'SAVE20'
            }
          }
        }
      },
      responses: {
        201: {
          description: 'تم إنشاء الطلب بنجاح',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DeliveryOrder' },
              example: {
                _id: '60f1b2b3c4d5e6f7g8h9i0j9',
                orderNumber: 'ORD-20240115-001',
                status: 'pending_confirmation',
                paymentMethod: 'cash',
                totalAmount: 125.50,
                deliveryFee: 15.00,
                tax: 8.75,
                discount: 10.00,
                items: [
                  {
                    productType: 'deliveryProduct',
                    product: '60f1b2b3c4d5e6f7g8h9i0j8',
                    quantity: 2,
                    price: 25.00,
                    customizations: ['حار جداً', 'بدون مايونيز']
                  }
                ],
                address: {
                  city: 'الرياض',
                  street: 'شارع الملك فهد',
                  building: 'عمارة 123',
                  apartment: 'شقة 45',
                  coordinates: {
                    lat: 24.7136,
                    lng: 46.6753
                  }
                },
                estimatedDeliveryTime: '2024-01-15T15:30:00.000Z',
                createdAt: '2024-01-15T14:00:00.000Z'
              }
            }
          }
        },
        400: {
          description: 'بيانات الطلب غير صالحة',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                'invalid-items': {
                  summary: 'عناصر الطلب غير صالحة',
                  value: {
                    error: {
                      code: 'INVALID_ORDER_ITEMS',
                      message: 'Order items are invalid'
                    },
                    detail: {
                      issues: [
                        'Product not found',
                        'Store is not available',
                        'Quantity exceeds stock'
                      ]
                    }
                  }
                },
                'invalid-address': {
                  summary: 'العنوان غير صالح',
                  value: {
                    error: {
                      code: 'INVALID_DELIVERY_ADDRESS',
                      message: 'Delivery address is invalid'
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        402: {
          description: 'مشكلة في الدفع أو الرصيد',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                'insufficient-balance': {
                  summary: 'رصيد غير كافي',
                  value: {
                    error: {
                      code: 'INSUFFICIENT_BALANCE',
                      message: 'Insufficient wallet balance'
                    },
                    detail: {
                      required: 125.50,
                      available: 50.00
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    get: {
      tags: ['Delivery', 'Orders'],
      summary: 'استرجاع قائمة الطلبات مع الفلترة',
      description: `
        استرجاع قائمة شاملة بجميع الطلبات مع إمكانيات الفلترة والتصفح المتقدمة:
        - فلترة حسب الحالة، المدينة، المتجر، السائق
        - البحث في تفاصيل الطلب
        - ترتيب حسب التاريخ أو المبلغ
        - تصفح النتائج (pagination)
      `,
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'رقم الصفحة'
        },
        {
          in: 'query',
          name: 'per_page',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'عدد العناصر في الصفحة'
        },
        {
          in: 'query',
          name: 'q',
          schema: { type: 'string' },
          description: 'نص البحث في تفاصيل الطلب'
        },
        {
          in: 'query',
          name: 'sort',
          schema: { type: 'string' },
          description: 'ترتيب البيانات',
          example: 'createdAt:desc'
        },
        {
          in: 'query',
          name: 'status',
          schema: {
            type: 'string',
            enum: ['pending_confirmation', 'under_review', 'preparing', 'assigned', 'out_for_delivery', 'delivered', 'returned', 'awaiting_procurement', 'procured', 'procurement_failed', 'cancelled']
          },
          description: 'فلترة حسب حالة الطلب'
        },
        {
          in: 'query',
          name: 'city',
          schema: { type: 'string' },
          description: 'فلترة حسب المدينة'
        },
        {
          in: 'query',
          name: 'storeId',
          schema: { type: 'string' },
          description: 'فلترة حسب المتجر'
        },
        {
          in: 'query',
          name: 'driverId',
          schema: { type: 'string' },
          description: 'فلترة حسب السائق'
        },
        {
          in: 'query',
          name: 'paymentMethod',
          schema: {
            type: 'string',
            enum: ['cash', 'card', 'wallet', 'cod', 'mixed']
          },
          description: 'فلترة حسب طريقة الدفع'
        },
        {
          in: 'query',
          name: 'from',
          schema: { type: 'string', format: 'date' },
          description: 'تاريخ البداية للفلترة'
        },
        {
          in: 'query',
          name: 'to',
          schema: { type: 'string', format: 'date' },
          description: 'تاريخ النهاية للفلترة'
        }
      ],
      responses: {
        200: {
          description: 'تم استرجاع قائمة الطلبات بنجاح',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/PaginatedResponse' },
                  {
                    type: 'object',
                    properties: {
                      orders: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/DeliveryOrder' }
                      }
                    }
                  }
                ]
              },
              example: {
                items: [
                  {
                    _id: '60f1b2b3c4d5e6f7g8h9i0j9',
                    orderNumber: 'ORD-20240115-001',
                    status: 'delivered',
                    paymentMethod: 'cash',
                    totalAmount: 125.50,
                    user: {
                      _id: '60f1b2b3c4d5e6f7g8h9i0j1',
                      fullName: 'محمد أحمد',
                      phone: '+966501234567'
                    },
                    driver: {
                      _id: '60f1b2b3c4d5e6f7g8h9i0j5',
                      fullName: 'أحمد محمد',
                      phone: '+966501234568'
                    },
                    store: {
                      _id: '60f1b2b3c4d5e6f7g8h9i0j6',
                      name: 'مطعم الرياض'
                    },
                    createdAt: '2024-01-15T10:30:00.000Z',
                    deliveredAt: '2024-01-15T11:45:00.000Z'
                  }
                ],
                pagination: {
                  page: 1,
                  limit: 20,
                  total: 150,
                  pages: 8
                },
                meta: {
                  page: 1,
                  per_page: 20,
                  total: 150,
                  returned: 20
                }
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/api/v1/delivery/stores': {
    get: {
      tags: ['Delivery', 'Stores'],
      summary: 'استرجاع قائمة المتاجر المتاحة',
      description: `
        استرجاع قائمة شاملة بالمتاجر المتاحة للتوصيل مع إمكانيات الفلترة:
        - فلترة حسب الفئة، الموقع، حالة المتجر
        - البحث في أسماء المتاجر والوصف
        - ترتيب حسب التقييم أو المسافة
        - تصفح النتائج
      `,
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'رقم الصفحة'
        },
        {
          in: 'query',
          name: 'per_page',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'عدد العناصر في الصفحة'
        },
        {
          in: 'query',
          name: 'q',
          schema: { type: 'string' },
          description: 'البحث في أسماء المتاجر والوصف'
        },
        {
          in: 'query',
          name: 'category',
          schema: { type: 'string' },
          description: 'فلترة حسب الفئة'
        },
        {
          in: 'query',
          name: 'city',
          schema: { type: 'string' },
          description: 'فلترة حسب المدينة'
        },
        {
          in: 'query',
          name: 'isOpen',
          schema: { type: 'boolean' },
          description: 'المتاجر المفتوحة فقط'
        },
        {
          in: 'query',
          name: 'rating',
          schema: { type: 'number', minimum: 0, maximum: 5 },
          description: 'الحد الأدنى للتقييم'
        },
        {
          in: 'query',
          name: 'sort',
          schema: {
            type: 'string',
            enum: ['rating', 'distance', 'name', 'deliveryTime']
          },
          description: 'ترتيب النتائج'
        }
      ],
      responses: {
        200: {
          description: 'تم استرجاع قائمة المتاجر بنجاح',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/PaginatedResponse' },
                  {
                    type: 'object',
                    properties: {
                      stores: {
                        type: 'array',
                        items: {
                          allOf: [
                            { $ref: '#/components/schemas/Store' },
                            {
                              type: 'object',
                              properties: {
                                distance: {
                                  type: 'number',
                                  description: 'المسافة بالكيلومترات'
                                },
                                estimatedDeliveryTime: {
                                  type: 'integer',
                                  description: 'وقت التوصيل المتوقع بالدقائق'
                                }
                              }
                            }
                          ]
                        }
                      }
                    }
                  }
                ]
              },
              example: {
                items: [
                  {
                    _id: '60f1b2b3c4d5e6f7g8h9i0j6',
                    name: 'مطعم الرياض',
                    description: 'مطعم متخصص في المأكولات العربية',
                    logo: 'https://example.com/logo.jpg',
                    banner: 'https://example.com/banner.jpg',
                    category: 'مطاعم',
                    phone: '+966501234569',
                    status: 'active',
                    rating: 4.2,
                    distance: 2.5,
                    estimatedDeliveryTime: 35,
                    isOpen: true,
                    openingHours: {
                      monday: { open: '08:00', close: '23:00', closed: false }
                    }
                  }
                ],
                pagination: {
                  page: 1,
                  limit: 20,
                  total: 45,
                  pages: 3
                }
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/api/v1/delivery/products': {
    get: {
      tags: ['Delivery', 'Products'],
      summary: 'استرجاع قائمة المنتجات المتاحة',
      description: `
        استرجاع قائمة شاملة بالمنتجات المتاحة للتوصيل مع إمكانيات الفلترة:
        - فلترة حسب المتجر، الفئة، السعر
        - البحث في أسماء المنتجات والمكونات
        - ترتيب حسب السعر أو التقييم
        - تصفح النتائج
      `,
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'رقم الصفحة'
        },
        {
          in: 'query',
          name: 'per_page',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'عدد العناصر في الصفحة'
        },
        {
          in: 'query',
          name: 'q',
          schema: { type: 'string' },
          description: 'البحث في أسماء المنتجات والوصف'
        },
        {
          in: 'query',
          name: 'storeId',
          schema: { type: 'string' },
          description: 'فلترة حسب المتجر'
        },
        {
          in: 'query',
          name: 'category',
          schema: { type: 'string' },
          description: 'فلترة حسب الفئة'
        },
        {
          in: 'query',
          name: 'minPrice',
          schema: { type: 'number', minimum: 0 },
          description: 'الحد الأدنى للسعر'
        },
        {
          in: 'query',
          name: 'maxPrice',
          schema: { type: 'number', minimum: 0 },
          description: 'الحد الأقصى للسعر'
        },
        {
          in: 'query',
          name: 'isAvailable',
          schema: { type: 'boolean' },
          description: 'المنتجات المتاحة فقط'
        },
        {
          in: 'query',
          name: 'sort',
          schema: {
            type: 'string',
            enum: ['price', 'rating', 'name', 'preparationTime']
          },
          description: 'ترتيب النتائج'
        }
      ],
      responses: {
        200: {
          description: 'تم استرجاع قائمة المنتجات بنجاح',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/PaginatedResponse' },
                  {
                    type: 'object',
                    properties: {
                      products: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Product' }
                      }
                    }
                  }
                ]
              },
              example: {
                items: [
                  {
                    _id: '60f1b2b3c4d5e6f7g8h9i0j8',
                    name: 'برجر لحم بقري',
                    description: 'برجر لحم طازج مع خضروات طازجة وصوص خاص',
                    price: 25.50,
                    image: 'https://example.com/burger.jpg',
                    category: 'الوجبات الرئيسية',
                    isAvailable: true,
                    preparationTime: 15,
                    calories: 450,
                    ingredients: ['لحم بقري', 'خس', 'طماطم', 'خبز', 'صوص خاص'],
                    customizations: [
                      {
                        name: 'مستوى النضج',
                        options: [
                          { name: 'نصف استواء', price: 0 },
                          { name: 'مستوي جيداً', price: 0 },
                          { name: 'مستوي تماماً', price: 0 }
                        ],
                        required: true
                      }
                    ],
                    rating: 4.2,
                    totalOrders: 150
                  }
                ],
                pagination: {
                  page: 1,
                  limit: 20,
                  total: 250,
                  pages: 13
                }
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/api/v1/delivery/cart': {
    get: {
      tags: ['Delivery', 'Cart'],
      summary: 'استرجاع محتويات سلة التسوق',
      description: `
        استرجاع محتويات سلة التسوق الحالية للمستخدم مع حساب التكلفة الإجمالية:
        - قائمة المنتجات المضافة للسلة
        - حساب المجموع الفرعي للمنتجات
        - حساب رسوم التوصيل حسب الموقع
        - حساب الضريبة والخصومات
        - تقدير وقت التوصيل
      `,
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'تم استرجاع محتويات السلة بنجاح',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Cart' },
              example: {
                _id: '60f1b2b3c4d5e6f7g8h9i0j10',
                user: '60f1b2b3c4d5e6f7g8h9i0j1',
                items: [
                  {
                    productType: 'deliveryProduct',
                    product: '60f1b2b3c4d5e6f7g8h9i0j8',
                    quantity: 2,
                    price: 25.00,
                    customizations: ['حار جداً'],
                    store: '60f1b2b3c4d5e6f7g8h9i0j6'
                  }
                ],
                subtotal: 50.00,
                deliveryFee: 15.00,
                tax: 5.25,
                discount: 10.00,
                total: 60.25,
                estimatedDeliveryTime: 45,
                isValid: true,
                expiresAt: '2024-01-15T15:00:00.000Z'
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    post: {
      tags: ['Delivery', 'Cart'],
      summary: 'إضافة منتج إلى سلة التسوق',
      description: 'إضافة منتج جديد إلى سلة التسوق مع التحقق من التوفر والتخصيصات',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['productType', 'product', 'quantity'],
              properties: {
                productType: {
                  type: 'string',
                  enum: ['merchantProduct', 'deliveryProduct']
                },
                product: { type: 'string' },
                quantity: { type: 'integer', minimum: 1 },
                customizations: {
                  type: 'array',
                  items: { type: 'string' }
                },
                notes: { type: 'string' }
              }
            },
            example: {
              productType: 'deliveryProduct',
              product: '60f1b2b3c4d5e6f7g8h9i0j8',
              quantity: 1,
              customizations: ['بدون مايونيز'],
              notes: 'بدون ملح إضافي'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم إضافة المنتج للسلة بنجاح',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Cart' }
            }
          }
        },
        400: {
          description: 'بيانات الطلب غير صالحة أو المنتج غير متاح',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                'product-not-available': {
                  summary: 'المنتج غير متاح',
                  value: {
                    error: {
                      code: 'PRODUCT_NOT_AVAILABLE',
                      message: 'Product is not available'
                    }
                  }
                },
                'store-not-operational': {
                  summary: 'المتجر غير متاح حالياً',
                  value: {
                    error: {
                      code: 'STORE_NOT_OPERATIONAL',
                      message: 'Store is not operational'
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  }
};

// إضافة مسارات لوحة الإدارة بالتفصيل
export const adminPanelPaths = {
  '/api/v1/admin/stats': {
    get: {
      tags: ['Admin'],
      summary: 'استرجاع إحصائيات لوحة الإدارة',
      description: `
        استرجاع إحصائيات شاملة للوحة الإدارة تشمل:
        - إحصائيات المستخدمين (عدد المستخدمين، المستخدمين الجدد، الحسابات النشطة)
        - إحصائيات الطلبات (عدد الطلبات، الإيرادات، متوسط قيمة الطلب)
        - إحصائيات السائقين (السائقين النشطين، متوسط التقييم، إنجاز الطلبات)
        - إحصائيات المتاجر (المتاجر النشطة، متوسط التقييم، الإيرادات)
        - إحصائيات النظام (حالة الخدمات، الأخطاء، الأداء)
      `,
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'period',
          schema: {
            type: 'string',
            enum: ['today', 'week', 'month', 'year'],
            default: 'today'
          },
          description: 'الفترة الزمنية للإحصائيات'
        },
        {
          in: 'query',
          name: 'includeDetails',
          schema: { type: 'boolean', default: false },
          description: 'تضمين التفاصيل المفصلة'
        }
      ],
      responses: {
        200: {
          description: 'تم استرجاع الإحصائيات بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  overview: {
                    type: 'object',
                    properties: {
                      totalUsers: { type: 'integer', example: 15420 },
                      activeUsers: { type: 'integer', example: 8930 },
                      newUsersToday: { type: 'integer', example: 45 },
                      totalOrders: { type: 'integer', example: 3250 },
                      completedOrders: { type: 'integer', example: 2980 },
                      totalRevenue: { type: 'number', example: 145000.50 },
                      averageOrderValue: { type: 'number', example: 48.60 },
                      totalDrivers: { type: 'integer', example: 180 },
                      activeDrivers: { type: 'integer', example: 145 },
                      totalStores: { type: 'integer', example: 85 },
                      activeStores: { type: 'integer', example: 72 }
                    }
                  },
                  trends: {
                    type: 'object',
                    properties: {
                      userGrowth: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            date: { type: 'string', format: 'date' },
                            count: { type: 'integer' }
                          }
                        }
                      },
                      orderGrowth: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            date: { type: 'string', format: 'date' },
                            count: { type: 'integer' },
                            revenue: { type: 'number' }
                          }
                        }
                      },
                      topCategories: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            category: { type: 'string' },
                            orders: { type: 'integer' },
                            revenue: { type: 'number' }
                          }
                        }
                      }
                    }
                  },
                  performance: {
                    type: 'object',
                    properties: {
                      averageDeliveryTime: { type: 'integer', example: 35 },
                      onTimeDeliveryRate: { type: 'number', example: 94.5 },
                      customerSatisfaction: { type: 'number', example: 4.3 },
                      driverEfficiency: { type: 'number', example: 87.2 },
                      systemUptime: { type: 'number', example: 99.9 }
                    }
                  }
                }
              },
              example: {
                overview: {
                  totalUsers: 15420,
                  activeUsers: 8930,
                  newUsersToday: 45,
                  totalOrders: 3250,
                  completedOrders: 2980,
                  totalRevenue: 145000.50,
                  averageOrderValue: 48.60,
                  totalDrivers: 180,
                  activeDrivers: 145,
                  totalStores: 85,
                  activeStores: 72
                },
                trends: {
                  userGrowth: [
                    { date: '2024-01-01', count: 15200 },
                    { date: '2024-01-02', count: 15250 },
                    { date: '2024-01-03', count: 15320 },
                    { date: '2024-01-04', count: 15420 }
                  ],
                  orderGrowth: [
                    { date: '2024-01-01', count: 3200, revenue: 142000.00 },
                    { date: '2024-01-02', count: 3180, revenue: 141500.00 },
                    { date: '2024-01-03', count: 3220, revenue: 144200.00 },
                    { date: '2024-01-04', count: 3250, revenue: 145000.50 }
                  ],
                  topCategories: [
                    { category: 'مطاعم', orders: 1850, revenue: 87500.00 },
                    { category: 'سوبر ماركت', orders: 920, revenue: 41200.00 },
                    { category: 'صيدليات', orders: 480, revenue: 16300.50 }
                  ]
                },
                performance: {
                  averageDeliveryTime: 35,
                  onTimeDeliveryRate: 94.5,
                  customerSatisfaction: 4.3,
                  driverEfficiency: 87.2,
                  systemUptime: 99.9
                }
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        403: {
          description: 'ليس لديك صلاحية للوصول لهذه البيانات',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                error: {
                  code: 'INSUFFICIENT_PERMISSIONS',
                  message: 'Insufficient permissions to access admin statistics'
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/v1/admin/users': {
    get: {
      tags: ['Admin', 'Users'],
      summary: 'استرجاع قائمة المستخدمين للإدارة',
      description: `
        استرجاع قائمة شاملة بجميع المستخدمين في النظام مع إمكانيات الفلترة والتصفح:
        - فلترة حسب الدور، الحالة، تاريخ التسجيل
        - البحث في الأسماء والبريد الإلكتروني والأرقام
        - ترتيب حسب التاريخ أو النشاط
        - تصفح النتائج مع إحصائيات مفصلة
      `,
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'رقم الصفحة'
        },
        {
          in: 'query',
          name: 'per_page',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'عدد العناصر في الصفحة'
        },
        {
          in: 'query',
          name: 'q',
          schema: { type: 'string' },
          description: 'البحث في الأسماء والبريد الإلكتروني'
        },
        {
          in: 'query',
          name: 'role',
          schema: {
            type: 'string',
            enum: ['user', 'driver', 'vendor', 'marketer', 'admin']
          },
          description: 'فلترة حسب الدور'
        },
        {
          in: 'query',
          name: 'status',
          schema: {
            type: 'string',
            enum: ['active', 'inactive', 'suspended', 'pending']
          },
          description: 'فلترة حسب الحالة'
        },
        {
          in: 'query',
          name: 'verified',
          schema: { type: 'boolean' },
          description: 'فلترة حسب حالة التحقق'
        },
        {
          in: 'query',
          name: 'sort',
          schema: {
            type: 'string',
            enum: ['createdAt', 'lastLogin', 'name', 'orders']
          },
          description: 'ترتيب النتائج'
        }
      ],
      responses: {
        200: {
          description: 'تم استرجاع قائمة المستخدمين بنجاح',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/PaginatedResponse' },
                  {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'array',
                        items: {
                          allOf: [
                            { $ref: '#/components/schemas/User' },
                            {
                              type: 'object',
                              properties: {
                                totalOrders: { type: 'integer' },
                                totalSpent: { type: 'number' },
                                lastOrderDate: { type: 'string', format: 'date-time' },
                                lastLoginDate: { type: 'string', format: 'date-time' },
                                isOnline: { type: 'boolean' },
                                registrationSource: { type: 'string' }
                              }
                            }
                          ]
                        }
                      },
                      summary: {
                        type: 'object',
                        properties: {
                          totalUsers: { type: 'integer' },
                          activeUsers: { type: 'integer' },
                          verifiedUsers: { type: 'integer' },
                          usersByRole: {
                            type: 'object',
                            properties: {
                              user: { type: 'integer' },
                              driver: { type: 'integer' },
                              vendor: { type: 'integer' },
                              marketer: { type: 'integer' },
                              admin: { type: 'integer' }
                            }
                          }
                        }
                      }
                    }
                  }
                ]
              },
              example: {
                items: [
                  {
                    _id: '60f1b2b3c4d5e6f7g8h9i0j1',
                    fullName: 'محمد أحمد علي',
                    email: 'user@example.com',
                    phone: '+966501234567',
                    role: 'user',
                    status: 'active',
                    emailVerified: true,
                    phoneVerified: false,
                    totalOrders: 15,
                    totalSpent: 750.25,
                    lastOrderDate: '2024-01-15T10:30:00.000Z',
                    lastLoginDate: '2024-01-15T14:20:00.000Z',
                    isOnline: true,
                    registrationSource: 'mobile_app',
                    createdAt: '2024-01-01T09:00:00.000Z'
                  }
                ],
                pagination: {
                  page: 1,
                  limit: 20,
                  total: 15420,
                  pages: 772
                },
                summary: {
                  totalUsers: 15420,
                  activeUsers: 8930,
                  verifiedUsers: 12450,
                  usersByRole: {
                    user: 14800,
                    driver: 320,
                    vendor: 180,
                    marketer: 85,
                    admin: 35
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        403: {
          description: 'ليس لديك صلاحية للوصول لهذه البيانات',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/api/v1/admin/delivery/kpis': {
    get: {
      tags: ['Admin', 'Analytics'],
      summary: 'استرجاع مؤشرات الأداء الرئيسية للتوصيل',
      description: `
        استرجاع مؤشرات الأداء الرئيسية (KPIs) لنظام التوصيل:
        - معدل التوصيل في الوقت المحدد
        - متوسط وقت التوصيل
        - معدل رضا العملاء
        - كفاءة السائقين
        - أداء المتاجر
        - معدلات الإلغاء والإرجاع
        - تكلفة التوصيل مقابل الإيرادات
      `,
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'period',
          schema: {
            type: 'string',
            enum: ['today', 'week', 'month', 'quarter', 'year'],
            default: 'month'
          },
          description: 'الفترة الزمنية للتحليل'
        },
        {
          in: 'query',
          name: 'city',
          schema: { type: 'string' },
          description: 'فلترة حسب المدينة'
        },
        {
          in: 'query',
          name: 'includeTrends',
          schema: { type: 'boolean', default: false },
          description: 'تضمين تحليل الاتجاهات'
        }
      ],
      responses: {
        200: {
          description: 'تم استرجاع مؤشرات الأداء بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  delivery: {
                    type: 'object',
                    properties: {
                      onTimeDeliveryRate: { type: 'number', example: 94.5 },
                      averageDeliveryTime: { type: 'integer', example: 35 },
                      ordersPerHour: { type: 'number', example: 12.5 },
                      cancellationRate: { type: 'number', example: 3.2 },
                      returnRate: { type: 'number', example: 1.8 }
                    }
                  },
                  drivers: {
                    type: 'object',
                    properties: {
                      averageRating: { type: 'number', example: 4.3 },
                      efficiencyScore: { type: 'number', example: 87.2 },
                      ordersCompleted: { type: 'integer', example: 1450 },
                      averageOrdersPerDay: { type: 'number', example: 8.5 }
                    }
                  },
                  stores: {
                    type: 'object',
                    properties: {
                      averageRating: { type: 'number', example: 4.1 },
                      preparationTime: { type: 'integer', example: 18 },
                      orderAcceptanceRate: { type: 'number', example: 96.8 }
                    }
                  },
                  financial: {
                    type: 'object',
                    properties: {
                      totalRevenue: { type: 'number', example: 145000.50 },
                      averageOrderValue: { type: 'number', example: 48.60 },
                      deliveryCostRatio: { type: 'number', example: 15.2 },
                      profitMargin: { type: 'number', example: 22.5 }
                    }
                  },
                  trends: {
                    type: 'object',
                    properties: {
                      deliveryTime: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            date: { type: 'string', format: 'date' },
                            value: { type: 'number' }
                          }
                        }
                      },
                      orderVolume: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            date: { type: 'string', format: 'date' },
                            count: { type: 'integer' }
                          }
                        }
                      }
                    }
                  }
                }
              },
              example: {
                delivery: {
                  onTimeDeliveryRate: 94.5,
                  averageDeliveryTime: 35,
                  ordersPerHour: 12.5,
                  cancellationRate: 3.2,
                  returnRate: 1.8
                },
                drivers: {
                  averageRating: 4.3,
                  efficiencyScore: 87.2,
                  ordersCompleted: 1450,
                  averageOrdersPerDay: 8.5
                },
                stores: {
                  averageRating: 4.1,
                  preparationTime: 18,
                  orderAcceptanceRate: 96.8
                },
                financial: {
                  totalRevenue: 145000.50,
                  averageOrderValue: 48.60,
                  deliveryCostRatio: 15.2,
                  profitMargin: 22.5
                },
                trends: {
                  deliveryTime: [
                    { date: '2024-01-01', value: 38 },
                    { date: '2024-01-02', value: 35 },
                    { date: '2024-01-03', value: 33 },
                    { date: '2024-01-04', value: 35 }
                  ],
                  orderVolume: [
                    { date: '2024-01-01', count: 320 },
                    { date: '2024-01-02', count: 340 },
                    { date: '2024-01-03', count: 360 },
                    { date: '2024-01-04', count: 380 }
                  ]
                }
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        403: {
          description: 'ليس لديك صلاحية للوصول لهذه البيانات',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  }
};

// إضافة مسارات المحفظة والخدمات المالية بالتفصيل
export const walletFinancePaths = {
  '/api/v1/wallet': {
    get: {
      tags: ['Wallet', 'Finance'],
      summary: 'استرجاع معلومات المحفظة الرقمية',
      description: `
        استرجاع معلومات شاملة عن المحفظة الرقمية للمستخدم:
        - الرصيد الحالي بالريال السعودي
        - حالة المحفظة (نشطة، مجمدة، معلقة)
        - حدود السحب اليومي والشهري
        - تاريخ آخر معاملة
        - إحصائيات الاستخدام
      `,
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'تم استرجاع معلومات المحفظة بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  _id: { type: 'string', example: '60f1b2b3c4d5e6f7g8h9i0j4' },
                  user: { type: 'string', example: '60f1b2b3c4d5e6f7g8h9i0j1' },
                  balance: {
                    type: 'number',
                    description: 'الرصيد الحالي بالريال السعودي',
                    example: 150.75
                  },
                  currency: {
                    type: 'string',
                    example: 'SAR',
                    description: 'عملة المحفظة'
                  },
                  status: {
                    type: 'string',
                    enum: ['active', 'frozen', 'suspended', 'pending'],
                    example: 'active',
                    description: 'حالة المحفظة'
                  },
                  dailyLimit: {
                    type: 'number',
                    example: 1000.00,
                    description: 'الحد اليومي للسحب'
                  },
                  monthlyLimit: {
                    type: 'number',
                    example: 5000.00,
                    description: 'الحد الشهري للسحب'
                  },
                  remainingDailyLimit: {
                    type: 'number',
                    example: 850.00,
                    description: 'المبلغ المتبقي من الحد اليومي'
                  },
                  remainingMonthlyLimit: {
                    type: 'number',
                    example: 4250.00,
                    description: 'المبلغ المتبقي من الحد الشهري'
                  },
                  lastTransaction: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-01-15T14:30:00.000Z',
                    description: 'تاريخ آخر معاملة'
                  },
                  totalSpentThisMonth: {
                    type: 'number',
                    example: 750.00,
                    description: 'إجمالي المبلغ المُنفق هذا الشهر'
                  },
                  totalReceivedThisMonth: {
                    type: 'number',
                    example: 1200.00,
                    description: 'إجمالي المبلغ المُستلم هذا الشهر'
                  },
                  createdAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-01-01T10:00:00.000Z'
                  },
                  updatedAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-01-15T14:30:00.000Z'
                  }
                }
              },
              example: {
                _id: '60f1b2b3c4d5e6f7g8h9i0j4',
                user: '60f1b2b3c4d5e6f7g8h9i0j1',
                balance: 150.75,
                currency: 'SAR',
                status: 'active',
                dailyLimit: 1000.00,
                monthlyLimit: 5000.00,
                remainingDailyLimit: 850.00,
                remainingMonthlyLimit: 4250.00,
                lastTransaction: '2024-01-15T14:30:00.000Z',
                totalSpentThisMonth: 750.00,
                totalReceivedThisMonth: 1200.00,
                createdAt: '2024-01-01T10:00:00.000Z',
                updatedAt: '2024-01-15T14:30:00.000Z'
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        404: {
          description: 'المحفظة غير موجودة',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                error: {
                  code: 'WALLET_NOT_FOUND',
                  message: 'Wallet not found'
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/v1/wallet/charge/kuraimi': {
    post: {
      tags: ['Wallet', 'Finance', 'Payment'],
      summary: 'شحن المحفظة عبر كريمي',
      description: `
        شحن المحفظة الرقمية باستخدام نظام الدفع كريمي.
        يتضمن هذا الطلب:
        1. إنشاء معاملة شحن جديدة
        2. توجيه المستخدم إلى صفحة الدفع الآمنة
        3. انتظار تأكيد الدفع من كريمي
        4. تحديث رصيد المحفظة عند نجاح الدفع
      `,
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amount', 'callbackUrl'],
              properties: {
                amount: {
                  type: 'number',
                  minimum: 10,
                  maximum: 10000,
                  description: 'مبلغ الشحن بالريال السعودي',
                  example: 100.00
                },
                callbackUrl: {
                  type: 'string',
                  format: 'uri',
                  description: 'رابط العودة بعد الدفع',
                  example: 'https://app.bthwani.com/wallet/callback'
                },
                description: {
                  type: 'string',
                  maxLength: 100,
                  description: 'وصف المعاملة',
                  example: 'شحن محفظة bThwani'
                },
                metadata: {
                  type: 'object',
                  description: 'بيانات إضافية للمعاملة',
                  properties: {
                    orderId: { type: 'string' },
                    userId: { type: 'string' },
                    source: { type: 'string', example: 'mobile_app' }
                  }
                }
              }
            },
            example: {
              amount: 100.00,
              callbackUrl: 'https://app.bthwani.com/wallet/callback',
              description: 'شحن محفظة bThwani',
              metadata: {
                orderId: 'TXN-20240115-001',
                userId: '60f1b2b3c4d5e6f7g8h9i0j1',
                source: 'mobile_app'
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم إنشاء معاملة الشحن بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  transactionId: {
                    type: 'string',
                    example: 'TXN-20240115-001',
                    description: 'معرف معاملة الشحن'
                  },
                  paymentUrl: {
                    type: 'string',
                    format: 'uri',
                    example: 'https://secure.kuraimi.com/pay/abc123',
                    description: 'رابط صفحة الدفع الآمنة'
                  },
                  amount: {
                    type: 'number',
                    example: 100.00,
                    description: 'مبلغ الشحن'
                  },
                  currency: {
                    type: 'string',
                    example: 'SAR',
                    description: 'العملة'
                  },
                  status: {
                    type: 'string',
                    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
                    example: 'pending',
                    description: 'حالة المعاملة'
                  },
                  expiresAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-01-15T15:00:00.000Z',
                    description: 'تاريخ انتهاء صلاحية الرابط'
                  }
                }
              },
              example: {
                transactionId: 'TXN-20240115-001',
                paymentUrl: 'https://secure.kuraimi.com/pay/abc123',
                amount: 100.00,
                currency: 'SAR',
                status: 'pending',
                expiresAt: '2024-01-15T15:00:00.000Z'
              }
            }
          }
        },
        400: {
          description: 'بيانات الطلب غير صالحة',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                'invalid-amount': {
                  summary: 'مبلغ الشحن غير صالح',
                  value: {
                    error: {
                      code: 'INVALID_CHARGE_AMOUNT',
                      message: 'Charge amount must be between 10 and 10000 SAR'
                    }
                  }
                },
                'exceeds-limit': {
                  summary: 'تجاوز الحد المسموح',
                  value: {
                    error: {
                      code: 'CHARGE_LIMIT_EXCEEDED',
                      message: 'Charge amount exceeds daily/monthly limit'
                    },
                    detail: {
                      maxAmount: 5000.00,
                      period: 'daily'
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        402: {
          description: 'مشكلة في الدفع أو الرصيد',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                error: {
                  code: 'PAYMENT_METHOD_UNAVAILABLE',
                  message: 'Payment method is currently unavailable'
                }
              }
            }
          }
        },
        503: {
          description: 'خدمة الدفع غير متاحة',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                error: {
                  code: 'PAYMENT_SERVICE_UNAVAILABLE',
                  message: 'Payment service is temporarily unavailable'
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/v1/wallet/withdraw-request': {
    post: {
      tags: ['Wallet', 'Finance', 'Withdrawal'],
      summary: 'طلب سحب من المحفظة',
      description: `
        طلب سحب مبلغ من المحفظة إلى حساب بنكي أو وسيلة دفع أخرى.
        يتطلب هذا الطلب:
        1. وجود رصيد كافي في المحفظة
        2. عدم تجاوز حدود السحب اليومي/الشهري
        3. توفر بيانات الحساب البنكي المُتحقق منها
        4. موافقة من نظام مكافحة الاحتيال
      `,
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amount', 'method', 'accountDetails'],
              properties: {
                amount: {
                  type: 'number',
                  minimum: 50,
                  maximum: 10000,
                  description: 'مبلغ السحب بالريال السعودي',
                  example: 200.00
                },
                method: {
                  type: 'string',
                  enum: ['bank_transfer', 'stc_pay', 'apple_pay', 'mada'],
                  description: 'وسيلة السحب',
                  example: 'bank_transfer'
                },
                accountDetails: {
                  type: 'object',
                  required: ['accountNumber', 'bankName'],
                  properties: {
                    accountNumber: {
                      type: 'string',
                      description: 'رقم الحساب البنكي'
                    },
                    bankName: {
                      type: 'string',
                      description: 'اسم البنك'
                    },
                    accountHolderName: {
                      type: 'string',
                      description: 'اسم صاحب الحساب'
                    },
                    iban: {
                      type: 'string',
                      pattern: '^SA[0-9]{22}$',
                      description: 'رقم الآيبان (إلزامي للحوالات البنكية)'
                    }
                  }
                },
                description: {
                  type: 'string',
                  maxLength: 100,
                  description: 'وصف السحب',
                  example: 'سحب للاستخدام الشخصي'
                }
              }
            },
            example: {
              amount: 200.00,
              method: 'bank_transfer',
              accountDetails: {
                accountNumber: '1234567890',
                bankName: 'البنك الأهلي السعودي',
                accountHolderName: 'محمد أحمد علي',
                iban: 'SA1234567890123456789012'
              },
              description: 'سحب للاستخدام الشخصي'
            }
          }
        }
      },
      responses: {
        201: {
          description: 'تم إرسال طلب السحب بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  withdrawalId: {
                    type: 'string',
                    example: 'WD-20240115-001',
                    description: 'معرف طلب السحب'
                  },
                  amount: {
                    type: 'number',
                    example: 200.00,
                    description: 'مبلغ السحب'
                  },
                  method: {
                    type: 'string',
                    example: 'bank_transfer',
                    description: 'وسيلة السحب'
                  },
                  status: {
                    type: 'string',
                    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
                    example: 'pending',
                    description: 'حالة طلب السحب'
                  },
                  estimatedProcessingTime: {
                    type: 'integer',
                    example: 1440,
                    description: 'الوقت المتوقع للمعالجة بالدقائق'
                  },
                  fees: {
                    type: 'number',
                    example: 2.00,
                    description: 'رسوم السحب (إن وجدت)'
                  },
                  netAmount: {
                    type: 'number',
                    example: 198.00,
                    description: 'المبلغ الصافي بعد خصم الرسوم'
                  }
                }
              },
              example: {
                withdrawalId: 'WD-20240115-001',
                amount: 200.00,
                method: 'bank_transfer',
                status: 'pending',
                estimatedProcessingTime: 1440,
                fees: 2.00,
                netAmount: 198.00
              }
            }
          }
        },
        400: {
          description: 'بيانات طلب السحب غير صالحة',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                'insufficient-balance': {
                  summary: 'رصيد غير كافي',
                  value: {
                    error: {
                      code: 'INSUFFICIENT_BALANCE',
                      message: 'Insufficient wallet balance'
                    },
                    detail: {
                      required: 200.00,
                      available: 150.75
                    }
                  }
                },
                'exceeds-limit': {
                  summary: 'تجاوز حد السحب',
                  value: {
                    error: {
                      code: 'WITHDRAWAL_LIMIT_EXCEEDED',
                      message: 'Withdrawal amount exceeds daily/monthly limit'
                    },
                    detail: {
                      maxAmount: 1000.00,
                      period: 'daily',
                      remaining: 850.00
                    }
                  }
                },
                'invalid-account': {
                  summary: 'بيانات الحساب غير صالحة',
                  value: {
                    error: {
                      code: 'INVALID_ACCOUNT_DETAILS',
                      message: 'Account details are invalid or not verified'
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        402: {
          description: 'مشكلة في الدفع أو الرصيد',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/api/v1/wallet/analytics': {
    get: {
      tags: ['Wallet', 'Finance', 'Analytics'],
      summary: 'استرجاع تحليلات المحفظة المالية',
      description: `
        استرجاع تحليلات شاملة لنشاط المحفظة المالية:
        - إحصائيات الإنفاق والإيداع
        - تحليل الاتجاهات الشهرية
        - توزيع المعاملات حسب الفئات
        - مقارنة مع الفترات السابقة
        - توقعات الإنفاق المستقبلية
      `,
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'period',
          schema: {
            type: 'string',
            enum: ['month', 'quarter', 'year'],
            default: 'month'
          },
          description: 'الفترة الزمنية للتحليل'
        },
        {
          in: 'query',
          name: 'includePredictions',
          schema: { type: 'boolean', default: false },
          description: 'تضمين توقعات الإنفاق المستقبلية'
        }
      ],
      responses: {
        200: {
          description: 'تم استرجاع تحليلات المحفظة بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  summary: {
                    type: 'object',
                    properties: {
                      totalSpent: { type: 'number', example: 750.00 },
                      totalReceived: { type: 'number', example: 1200.00 },
                      netFlow: { type: 'number', example: 450.00 },
                      transactionCount: { type: 'integer', example: 45 },
                      averageTransaction: { type: 'number', example: 42.50 }
                    }
                  },
                  categories: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        category: { type: 'string', example: 'طعام ومشروبات' },
                        amount: { type: 'number', example: 320.50 },
                        count: { type: 'integer', example: 12 },
                        percentage: { type: 'number', example: 42.7 }
                      }
                    }
                  },
                  trends: {
                    type: 'object',
                    properties: {
                      monthlySpending: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            month: { type: 'string', example: '2024-01' },
                            amount: { type: 'number' },
                            change: { type: 'number' }
                          }
                        }
                      },
                      topMerchants: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            merchant: { type: 'string' },
                            amount: { type: 'number' },
                            visits: { type: 'integer' }
                          }
                        }
                      }
                    }
                  },
                  predictions: {
                    type: 'object',
                    properties: {
                      nextMonthSpending: { type: 'number', example: 850.00 },
                      savingsPotential: { type: 'number', example: 150.00 },
                      budgetRecommendation: { type: 'number', example: 800.00 }
                    }
                  }
                }
              },
              example: {
                summary: {
                  totalSpent: 750.00,
                  totalReceived: 1200.00,
                  netFlow: 450.00,
                  transactionCount: 45,
                  averageTransaction: 42.50
                },
                categories: [
                  {
                    category: 'طعام ومشروبات',
                    amount: 320.50,
                    count: 12,
                    percentage: 42.7
                  },
                  {
                    category: 'مواصلات',
                    amount: 180.25,
                    count: 8,
                    percentage: 24.0
                  },
                  {
                    category: 'تسوق',
                    amount: 150.75,
                    count: 15,
                    percentage: 20.1
                  },
                  {
                    category: 'خدمات',
                    amount: 98.50,
                    count: 10,
                    percentage: 13.1
                  }
                ],
                trends: {
                  monthlySpending: [
                    { month: '2023-12', amount: 680.00, change: -8.5 },
                    { month: '2024-01', amount: 750.00, change: 10.3 }
                  ],
                  topMerchants: [
                    { merchant: 'مطعم الرياض', amount: 150.00, visits: 8 },
                    { merchant: 'سوبر ماركت النور', amount: 120.50, visits: 6 },
                    { merchant: 'محطة وقود أرامكو', amount: 85.25, visits: 12 }
                  ]
                },
                predictions: {
                  nextMonthSpending: 850.00,
                  savingsPotential: 150.00,
                  budgetRecommendation: 800.00
                }
              }
            }
          }
        },
        401: {
          description: 'غير مصرح للوصول',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  }
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
