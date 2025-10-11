import { NextFunction, Request, Response } from "express";
import ReferralEvents from "../../models/fieldMarketingV1/ReferralEvents";

// Generate short ID for referral links
function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8);
}

// GET /api/v1/referrals/link - Generate or get referral link for marketer
export async function getReferralLink(req: Request, res: Response, next: NextFunction) {
  try {
    const marketerId = (req as any).user?.id;

    if (!marketerId) {
       res.status(401).json({ message: "Unauthorized" });
       return;
    }

    // Check if marketer already has a referral code
    const existingEvent = await ReferralEvents.findOne(
      { marketerId, type: 'click' },
      { ref: 1 }
    ).sort({ createdAt: -1 });

    let refCode: string;

    if (existingEvent?.ref) {
      // Extract the shortId from existing ref (mk_<shortId>)
      refCode = existingEvent.ref.replace('mk_', '');
    } else {
      // Generate new referral code
      refCode = generateShortId();

      // Create initial click event to store the ref code
      await ReferralEvents.create({
        marketerId,
        type: 'click',
        ref: `mk_${refCode}`,
        meta: { action: 'link_generated' }
      });
    }

    const referralLink = `https://bthwani.com/signup?ref=mk_${refCode}`;

    res.json({
      link: referralLink,
      ref: `mk_${refCode}`,
      marketerId
    });

  } catch (err) {
    next(err);
  }
}

// POST /api/v1/referrals/track - Track referral clicks (public endpoint)
export async function trackReferral(req: Request, res: Response, next: NextFunction) {
  try {
    const { ref, type } = req.body;

    if (!ref || !type) {
       res.status(400).json({ message: "ref and type are required" });
       return;
    }

    if (!['click', 'signup'].includes(type)) {
       res.status(400).json({ message: "Invalid type. Must be 'click' or 'signup'" });
       return;
    }

    // Extract marketer ID from ref code (mk_<shortId>)
    if (!ref.startsWith('mk_')) {
       res.status(400).json({ message: "Invalid referral code format" });
       return;
    }

    const shortId = ref.replace('mk_', '');
    const marketerId = await getMarketerIdByRef(shortId);

    if (!marketerId) {
       res.status(404).json({ message: "Referral code not found" });
       return;
    }

    // Record the event
    const event = await ReferralEvents.create({
      marketerId,
      type,
      ref,
      meta: {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        referrer: req.headers.referer
      }
    });

    res.json({
      success: true,
      eventId: event._id,
      message: `${type} tracked successfully`
    });

  } catch (err) {
    next(err);
  }
}

// GET /api/v1/referrals/stats - Get referral statistics for marketer
export async function getReferralStats(req: Request, res: Response, next: NextFunction) {
  try {
    const marketerId = (req as any).user?.id;

    if (!marketerId) {
         res.status(401).json({ message: "Unauthorized" });
       return;
    }

    // Get all referral events for this marketer
    const events = await ReferralEvents.aggregate([
      { $match: { marketerId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to expected format
    const stats = {
      clicks: 0,
      signups: 0,
      conversions: 0 // Could be calculated as signups/clicks ratio later
    };

    events.forEach(event => {
      if (event._id === 'click') {
        stats.clicks = event.count;
      } else if (event._id === 'signup') {
        stats.signups = event.count;
      }
    });

    // Calculate conversion rate
    stats.conversions = stats.clicks > 0 ? (stats.signups / stats.clicks) * 100 : 0;

    res.json(stats);

  } catch (err) {
    next(err);
  }
}

// Helper function to get marketer ID by referral code
async function getMarketerIdByRef(shortId: string): Promise<string | null> {
  const event = await ReferralEvents.findOne(
    { ref: `mk_${shortId}` },
    { marketerId: 1 }
  ).sort({ createdAt: -1 });

  return event?.marketerId || null;
}
