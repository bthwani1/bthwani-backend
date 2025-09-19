import AppSettings from "../models/cms/AppSettings";
import CmsTheme from "../models/cms/CmsTheme";
import HomeLayout from "../models/cms/HomeLayout";
import OnboardingSlide from "../models/cms/OnboardingSlide";
import CmsPage from "../models/cms/CmsPage";
import CmsString from "../models/cms/CmsString";
import EmptyState from "../models/cms/EmptyState";
import FeatureFlag from "../models/cms/FeatureFlag";

export async function fetchBootstrap(lang: "ar"|"en" = "ar", city?: string, channel: "app"|"web" = "app") {
  const [settings, theme, layout, slides, strings, empties, flags] = await Promise.all([
    AppSettings.findOne({}).lean(),
    CmsTheme.findOne({}).lean(),
    HomeLayout.findOne({ active: true, ...(city?{city}:{}) , channel }).sort({ order: 1 }).lean(),
    OnboardingSlide.find({ active: true }).sort({ order: 1 }).lean(),
    CmsString.find({}).lean(),
    EmptyState.find({ active: true }).lean(),
    FeatureFlag.find({}).lean(),
  ]);

  const t = (obj?: { ar?: string; en?: string }) => obj?.[lang] ?? obj?.ar ?? obj?.en ?? "";

  return {
    version: `${settings?._id || "0"}:${theme?._id || "0"}:${layout?._id || "0"}`,
    settings: settings ? {
      appName: settings.appName,
      defaultLanguage: settings.defaultLanguage,
      supportedLanguages: settings.supportedLanguages,
      minVersion: settings.minVersion,
      payments: settings.payments,
      updatePolicy: { force: settings.updatePolicy?.force, message: t(settings.updatePolicy?.message) },
      featureFlags: settings.featureFlags,
    } : {},
    theme,
    homeLayout: layout,
    onboarding: slides?.map(s => ({
      key: s.key, title: t(s.title), subtitle: t(s.subtitle),
      media: s.media, cta: { label: t(s.cta?.label), action: s.cta?.action }
    })),
    strings: strings?.reduce((acc:any, cur:any) => { acc[cur.key] = cur[lang] ?? cur.ar ?? cur.en; return acc; }, {}),
    emptyStates: empties?.reduce((acc:any, cur:any) => { acc[cur.key] = {
      image: cur.image, title: t(cur.title), subtitle: t(cur.subtitle), cta: { label: t(cur.cta?.label), deeplink: cur.cta?.deeplink }
    }; return acc; }, {}),
    featureFlags: flags?.reduce((acc:any, cur:any) => { acc[cur.key] = cur.enabled; return acc; }, {})
  };
}
