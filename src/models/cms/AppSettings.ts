import mongoose, { Document, Schema } from "mongoose";

export interface IAppSettings extends Document {
  appName?: string;
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
}

const schema = new Schema<IAppSettings>({
  appName: String,
  defaultLanguage: { type: String, enum: ["ar", "en"], default: "ar" },
  supportedLanguages: { type: [String], default: ["ar","en"] },
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
