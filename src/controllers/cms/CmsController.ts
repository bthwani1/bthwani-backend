import { Request, Response } from "express";
import CmsPage from "../../models/cms/CmsPage";
import { fetchBootstrap } from "../../services/bootstrap";

export const getBootstrap = async (req: Request, res: Response) => {
  try {
    const lang = (req.query.lang as "ar"|"en") || "ar";
    const city = (req.query.city as string) || undefined;
    const channel = (req.query.channel as "app"|"web") || "app";

    const data = await fetchBootstrap(lang, city, channel);

    // Optional ETag
    res.setHeader("ETag", data.version);
    if (req.headers["if-none-match"] === data.version) {
       res.status(304).end();
       return;
    }

    res.json(data);
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPage = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const lang = (req.query.lang as "ar"|"en") || "ar";
    const page = await CmsPage.findOne({ slug, isPublic: true }).lean();
      if (!page) {
      res.status(404).json({ message: "Page not found" });
      return;
    }

    const title = page.title?.[lang] ?? page.title?.ar ?? page.title?.en ?? "";
    const content = page.content?.[lang] ?? page.content?.ar ?? page.content?.en ?? "";
    res.json({ slug: page.slug, title, content, updatedAt: (page as any).updatedAt });
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};
