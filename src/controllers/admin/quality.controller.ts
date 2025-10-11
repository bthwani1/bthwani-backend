// server/src/controllers/admin/quality.controller.ts
import { Request, Response } from 'express';
import QualityReview from '../../models/quality/qualityReview.model';
import { parseListQuery } from '../../utils/query';

export const getQualityReviews = async (req: Request, res: Response) => {
  try {
    const { filters, page, perPage } = parseListQuery(req.query);

    // Build query
    const query: any = {};

    // Filter by entity type
    if (req.query.entityType) {
      query.entityType = req.query.entityType;
    }

    // Filter by entity ID
    if (req.query.entityId) {
      if (req.query.entityType === 'driver') {
        query.driver = req.query.entityId;
      } else if (req.query.entityType === 'store') {
        query.store = req.query.entityId;
      } else if (req.query.entityType === 'order') {
        query.orderId = req.query.entityId;
      }
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Date range filter
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) {
        query.createdAt.$gte = new Date(req.query.from as string);
      }
      if (req.query.to) {
        query.createdAt.$lte = new Date(req.query.to as string);
      }
    }

    const skip = (page - 1) * perPage;
    const total = await QualityReview.countDocuments(query);
    const reviews = await QualityReview.find(query)
      .populate('user', 'fullName phone')
      .populate('driver', 'fullName phone')
      .populate('store', 'name')
      .populate('hiddenBy', 'name')
      .sort(filters.sort)
      .skip(skip)
      .limit(perPage);

    // Calculate stats
    const stats = await QualityReview.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          averageCompanyRating: { $avg: '$rating.company' },
          averageOrderRating: { $avg: '$rating.order' },
          averageDriverRating: { $avg: '$rating.driver' },
          totalRatings: { $sum: 1 },
          fiveStarPercentage: {
            $sum: {
              $cond: [
                { $gte: ['$rating.company', 5] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      averageCompanyRating: 0,
      averageOrderRating: 0,
      averageDriverRating: 0,
      totalRatings: 0,
      fiveStarPercentage: 0
    };

    // Calculate percentage
    result.fiveStarPercentage = total > 0 ? (result.fiveStarPercentage / total) * 100 : 0;

    res.json({
      ratings: reviews.map(review => ({
        _id: review._id,
        orderId: review.orderId,
        user: review.user ? {
          _id: review.user._id,
          name: (review.user as any).fullName,
          phone: (review.user as any).phone,
        } : null,
        driver: review.driver ? {
          _id: review.driver._id,
          name: (review.driver as any).fullName,
          phone: (review.driver as any).phone,
        } : null,
        store: review.store ? {
          _id: review.store._id,
          name: (review.store as any).name,
        } : null,
        rating: review.rating,
        status: review.status,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        hiddenAt: review.hiddenAt,
        hiddenBy: review.hiddenBy ? {
          _id: review.hiddenBy._id,
          name: (review.hiddenBy as any).fullName,
        } : null,
        hiddenReason: review.hiddenReason,
      })),
      pagination: {
        page,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage),
      },
      stats: result,
    });
  } catch (error) {
    console.error('Error fetching quality reviews:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const hideQualityReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const review = await QualityReview.findByIdAndUpdate(
      id,
      {
        status: 'hidden',
        hiddenBy: (req as any).userData?._id,
        hiddenAt: new Date(),
        hiddenReason: reason,
      },
      { new: true }
    )
      .populate('user', 'fullName phone')
      .populate('driver', 'fullName phone')
      .populate('store', 'name')
      .populate('hiddenBy', 'name');

    if (!review) {
       res.status(404).json({ message: 'Review not found' });
       return;
    }

    res.json(review);
  } catch (error) {
    console.error('Error hiding quality review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const publishQualityReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const review = await QualityReview.findByIdAndUpdate(
      id,
      {
        status: 'published',
        hiddenBy: null,
        hiddenAt: null,
        hiddenReason: null,
      },
      { new: true }
    )
      .populate('user', 'fullName phone')
      .populate('driver', 'fullName phone')
      .populate('store', 'name')
      .populate('hiddenBy', 'name');

    if (!review) {
       res.status(404).json({ message: 'Review not found' });
       return;
    }

    res.json(review);
  } catch (error) {
    console.error('Error publishing quality review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getQualityReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const review = await QualityReview.findById(id)
      .populate('user', 'fullName phone')
      .populate('driver', 'fullName phone')
      .populate('store', 'name')
      .populate('hiddenBy', 'name');

    if (!review) {
       res.status(404).json({ message: 'Review not found' });
       return;
    }

    res.json(review);
  } catch (error) {
    console.error('Error fetching quality review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getQualityStats = async (req: Request, res: Response) => {
  try {
    const query: any = {};

    // Apply filters
    if (req.query.entityType) {
      query.entityType = req.query.entityType;
    }

    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) {
        query.createdAt.$gte = new Date(req.query.from as string);
      }
      if (req.query.to) {
        query.createdAt.$lte = new Date(req.query.to as string);
      }
    }

    const stats = await QualityReview.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          averageCompanyRating: { $avg: '$rating.company' },
          averageOrderRating: { $avg: '$rating.order' },
          averageDriverRating: { $avg: '$rating.driver' },
          totalRatings: { $sum: 1 },
          publishedRatings: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          },
          hiddenRatings: {
            $sum: { $cond: [{ $eq: ['$status', 'hidden'] }, 1, 0] }
          },
          pendingRatings: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      averageCompanyRating: 0,
      averageOrderRating: 0,
      averageDriverRating: 0,
      totalRatings: 0,
      publishedRatings: 0,
      hiddenRatings: 0,
      pendingRatings: 0,
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching quality stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
