import mongoose, { Document, Schema } from "mongoose";

export interface IAppSettings extends Document {
  appName?: string;
  tagline?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  theme?: 'light' | 'dark' | 'auto';
  defaultLanguage?: "ar" | "en";
  supportedLanguages: ("ar" | "en")[];
  minVersion?: { android?: string; ios?: string };
  payments?: {
    methods: { key: string; enabled: boolean; label?: { ar?: string; en?: string } }[];
  };
  coverage?: {
    cities?: string[];
  };
  updatePolicy?: { force?: boolean; message?: { ar?: string; en?: string } };
  featureFlags?: Record<string, boolean>;
  themeRef?: mongoose.Types.ObjectId; // CmsTheme reference

  // Appearance settings
  enableAnimations?: boolean;
  compactMode?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  borderRadius?: 'none' | 'small' | 'medium' | 'large';

  // Metadata
  updatedBy?: mongoose.Types.ObjectId;
  lastUpdated?: Date;
}

const schema = new Schema<IAppSettings>({
  appName: { type: String, default: 'بطواني' },
  tagline: { type: String, default: 'أفضل خدمة توصيل' },
  logo: String,
  favicon: String,
  primaryColor: { type: String, default: '#FF500D' },
  secondaryColor: { type: String, default: '#5D4037' },
  theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
  defaultLanguage: { type: String, enum: ["ar", "en"], default: "ar" },
  supportedLanguages: { type: [String], default: ["ar","en"] },
  enableAnimations: { type: Boolean, default: true },
  compactMode: { type: Boolean, default: false },
  fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
  borderRadius: { type: String, enum: ['none', 'small', 'medium', 'large'], default: 'medium' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  lastUpdated: { type: Date, default: Date.now },
  minVersion: { android: String, ios: String },
  payments: {
    methods: [{
      key: { type: String, required: true },
      enabled: { type: Boolean, default: true },
      label: { ar: String, en: String },
    }]
  },
  coverage: { cities: [String] },
  updatePolicy: { 
    force: { type: Boolean, default: false },
    message: { ar: String, en: String }
  },
  featureFlags: { type: Schema.Types.Mixed, default: {} },
  themeRef: { type: Schema.Types.ObjectId, ref: "CmsTheme" }
}, { timestamps: true });

export default mongoose.model<IAppSettings>("AppSettings", schema);
