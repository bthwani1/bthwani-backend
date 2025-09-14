import { Request } from "express";

// types/user.types.ts
export interface Address {
  _id?: string; // ✅ اجعل الـ _id اختيارياً

  label?: string;
  location?: { lat: number; lng: number };
  street?: string;
  city?: string;
}

export interface Wallet {
  balance: number;
  currency: string;
  totalSpent: number;
  totalEarned: number;
  lastUpdated: Date;
  loyaltyPoints: number;
  onHold: number;

  escrow: number;
  savings: number;
}

export interface Security {
  pinCode: string | null;
  twoFactorEnabled: boolean;
}

export interface Transaction {
  amount: number;
  type: "credit" | "debit";
  description: string;
  method: string;
  status: string;
  date?: Date;
}

export interface ActivityLog {
  action: string;
  target: string;
  at?: Date;
}

export interface FreelancerProfile {
  service?: string;
  bio?: string;
  availability: {
    day: string;
    start: string;
    end: string;
  }[];
  bookings: {
    userId: string;
    date: Date;
    status: string;
  }[];

  portfolioImages: string[];
  badges?: string[];
  reviews?: {
    userId: string;
    rating: number;
    comment?: string;
    createdAt?: Date;
    flagged?: boolean;
  }[];
}

export interface NotificationFeed {
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
}

export interface UserType {
  fullName: string;
  aliasName?: string;
  emailVerified: boolean;
  freelancerProfile?: Partial<FreelancerProfile>;
  pushToken: string;
  foundResolvedCount?: number;
  badges?: string[];
  email?: string;
  negativeRatingCount: number;
  classification: string;
  isBlacklisted: boolean;
  phone?: string;
  profileImage?: string;
  role: "user" | "admin" | "superadmin" | "driver";
  bloodRequests: string[]; // ObjectId[] → معرفات الطلبات التي أنشأها
  donationLocation?: {
    type?: "Point";
    coordinates?: [number, number];
    updatedAt?: Date;
  };
  donationHistory: {
    requestId: string;
    date: Date;
    location: {
      lat: number;
      lng: number;
    };
  }[];
  isDriver?: boolean;
  isAvailableForDelivery?: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt: Date;
  };
  subscription?: {
    planId: string;
    startedAt: Date;
    nextBilling: Date;
  };
  deliveryStats?: {
    deliveredCount: number;
    canceledCount: number;
    totalDistanceKm: number;
    earnings: number;
  };

  firebaseUID: string;
  authProvider: "firebase" | "local";

  isVerified: boolean;
  isBanned: boolean;
  isActive: boolean;
  followers: string[];
  following: string[];

  addresses: Address[];
  defaultAddressId: { type: String; default: null };

  language: "ar" | "en";
  theme: "light" | "dark";
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  availability: boolean;
  postsCount: number;
  messagesCount: number;
  followersCount: number;
  favoritesCount: number;

  loginHistory: {
    ip: string;
    userAgent: string;
    at: Date;
  }[];

  favorites: string[]; // ObjectId[]
  notificationsFeed: NotificationFeed[];

  // blood
  bloodType?: string;
  isAvailableToDonate?: boolean;

  // freelancer
  isFreelancer?: boolean;

  // jobs/bookings
  jobPosts: string[];
  bookingPosts: string[];
  bookingStats: {
    views: number;
    orders: number;
  };

  // lost & found
  lostAndFoundPosts: string[];
  lostStats: {
    views: number;
    comments: number;
  };

  wallet: Wallet;
  security: Security;
  transactions: Transaction[];
  activityLog: ActivityLog[];
}

interface MulterRequest extends Request {
  file: any;
}
