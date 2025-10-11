// server/src/controllers/admin/settings.controller.ts
import { Request, Response } from 'express';
import AppSettings from '../../models/cms/AppSettings';

// Get appearance settings
export const getAppearanceSettings = async (req: Request, res: Response) => {
  try {
    let settings = await AppSettings.findOne();

    if (!settings) {
      // Create default settings if none exist
      settings = new AppSettings();
      await settings.save();
    }

    // Return only appearance-related fields
    const appearanceSettings = {
      appName: settings.appName,
      tagline: settings.tagline,
      logo: settings.logo,
      favicon: settings.favicon,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      theme: settings.theme,
      defaultLanguage: settings.defaultLanguage,
      enableAnimations: settings.enableAnimations,
      compactMode: settings.compactMode,
      fontSize: settings.fontSize,
      borderRadius: settings.borderRadius,
    };

    res.json(appearanceSettings);
  } catch (error) {
    console.error('Error fetching appearance settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update appearance settings
export const updateAppearanceSettings = async (req: Request, res: Response) => {
  try {
    const {
      appName,
      tagline,
      logo,
      favicon,
      primaryColor,
      secondaryColor,
      theme,
      defaultLanguage,
      enableAnimations,
      compactMode,
      fontSize,
      borderRadius,
    } = req.body;

    let settings = await AppSettings.findOne();

    if (!settings) {
      // Create default settings if none exist
      settings = new AppSettings();
    }

    // Update fields if provided
    if (appName !== undefined) settings.appName = appName;
    if (tagline !== undefined) settings.tagline = tagline;
    if (logo !== undefined) settings.logo = logo;
    if (favicon !== undefined) settings.favicon = favicon;
    if (primaryColor !== undefined) settings.primaryColor = primaryColor;
    if (secondaryColor !== undefined) settings.secondaryColor = secondaryColor;
    if (theme !== undefined) settings.theme = theme;
    if (defaultLanguage !== undefined) settings.defaultLanguage = defaultLanguage;
    if (enableAnimations !== undefined) settings.enableAnimations = enableAnimations;
    if (compactMode !== undefined) settings.compactMode = compactMode;
    if (fontSize !== undefined) settings.fontSize = fontSize;
    if (borderRadius !== undefined) settings.borderRadius = borderRadius;

    // Update metadata
    settings.updatedBy = (req as any).userData?._id;
    settings.lastUpdated = new Date();

    await settings.save();

    // Return updated settings
    const updatedSettings = {
      appName: settings.appName,
      tagline: settings.tagline,
      logo: settings.logo,
      favicon: settings.favicon,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      theme: settings.theme,
      defaultLanguage: settings.defaultLanguage,
      enableAnimations: settings.enableAnimations,
      compactMode: settings.compactMode,
      fontSize: settings.fontSize,
      borderRadius: settings.borderRadius,
    };

    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating appearance settings:', error);
    if (error.name === 'ValidationError') {
       res.status(400).json({ message: error.message });
       return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all app settings (for admin use)
export const getAllSettings = async (req: Request, res: Response) => {
  try {
    let settings = await AppSettings.findOne();

    if (!settings) {
      // Create default settings if none exist
      settings = new AppSettings();
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching app settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update all app settings (for admin use)
export const updateAllSettings = async (req: Request, res: Response) => {
  try {
    let settings = await AppSettings.findOne();

    if (!settings) {
      // Create default settings if none exist
      settings = new AppSettings();
    }

    // Update all provided fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        (settings as any)[key] = req.body[key];
      }
    });

    // Update metadata
    settings.updatedBy = (req as any).userData?._id;
    settings.lastUpdated = new Date();

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Error updating app settings:', error);
    if (error.name === 'ValidationError') {
       res.status(400).json({ message: error.message });
       return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
