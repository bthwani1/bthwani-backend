import { Request, Response } from "express";
import Onboarding from "../../models/fieldMarketingV1/Onboarding";

function dt(s?: string) {
  return s ? new Date(s) : undefined;
}

export async function overview(req: Request, res: Response) {
  const { from, to } = req.query as any;
  const match: any = {};
  if (from || to) match.createdAt = {};
  if (from) match.createdAt.$gte = dt(from);
  if (to) match.createdAt.$lte = dt(to);

  const base = await Onboarding.aggregate([
    { $match: match },
    { $unwind: "$participants" },
    {
      $group: {
        _id: "$participants.marketerId",
        submittedW: {
          $sum: {
            $cond: [
              { $eq: ["$status", "submitted"] },
              { $ifNull: ["$participants.weight", 0.5] },
              0,
            ],
          },
        },
        approvedW: {
          $sum: {
            $cond: [
              { $eq: ["$status", "approved"] },
              { $ifNull: ["$participants.weight", 0.5] },
              0,
            ],
          },
        },
        rejectedW: {
          $sum: {
            $cond: [
              { $eq: ["$status", "rejected"] },
              { $ifNull: ["$participants.weight", 0.5] },
              0,
            ],
          },
        },
        needsFixW: {
          $sum: {
            $cond: [
              { $eq: ["$status", "needs_fix"] },
              { $ifNull: ["$participants.weight", 0.5] },
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        marketerId: "$._id",
        _id: 0,
        submittedW: 1,
        approvedW: 1,
        rejectedW: 1,
        needsFixW: 1,
        approvalRate: {
          $cond: [
            { $gt: ["$submittedW", 0] },
            { $divide: ["$approvedW", "$submittedW"] },
            0,
          ],
        },
      },
    },
    { $sort: { approvedW: -1 } },
  ]);

  res.json(base);
}

export async function perMarketer(req: Request, res: Response) {
  const { id } = req.params;
  const { from, to, page = 1, limit = 20 } = req.query as any;

  const match: any = { "participants.marketerId": id };
  if (from || to) match.createdAt = {};
  if (from) match.createdAt.$gte = new Date(from);
  if (to) match.createdAt.$lte = new Date(to);

  const [result] = await Onboarding.aggregate([
    { $match: match },
    {
      $facet: {
        pagedItems: [
          { $sort: { createdAt: -1 } },
          {
            $project: {
              "storeDraft.name": 1,
              status: 1,
              participants: 1,
              createdAt: 1,
              submittedAt: 1,
              reviewedAt: 1,
            },
          },
          { $skip: (Number(page) - 1) * Number(limit) },
          { $limit: Number(limit) },
        ],
        totals: [
          {
            $group: {
              _id: null,
              submitted: {
                $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] },
              },
              approved: {
                $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
              },
              rejected: {
                $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
              },
              needsFix: {
                $sum: { $cond: [{ $eq: ["$status", "needs_fix"] }, 1, 0] },
              },
              submittedW: {
                $sum: {
                  $cond: [
                    { $eq: ["$status", "submitted"] },
                    {
                      $ifNull: [
                        { $arrayElemAt: ["$participants.weight", 0] },
                        0.5,
                      ],
                    },
                    0,
                  ],
                },
              },
              approvedW: {
                $sum: {
                  $cond: [
                    { $eq: ["$status", "approved"] },
                    {
                      $ifNull: [
                        { $arrayElemAt: ["$participants.weight", 0] },
                        0.5,
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
    {
      $project: {
        items: "$pagedItems",
        totals: {
          $ifNull: [
            { $arrayElemAt: ["$totals", 0] },
            {
              submitted: 0,
              approved: 0,
              rejected: 0,
              needsFix: 0,
              submittedW: 0,
              approvedW: 0,
            },
          ],
        },
        total: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
      },
    },
    {
      $addFields: {
        approvalRate: {
          $cond: [
            { $gt: ["$totals.submitted", 0] },
            { $divide: ["$totals.approved", "$totals.submitted"] },
            0,
          ],
        },
        approvalRateW: {
          $cond: [
            { $gt: ["$totals.submittedW", 0] },
            { $divide: ["$totals.approvedW", "$totals.submittedW"] },
            0,
          ],
        },
      },
    },
  ]);

  res.json({
    uid: id,
    submitted: result?.totals?.submitted || 0,
    approved: result?.totals?.approved || 0,
    rejected: result?.totals?.rejected || 0,
    needsFix: result?.totals?.needsFix || 0,
    approvalRate: result?.approvalRate || 0,
    approvalRateW: result?.approvalRateW || 0,
    pagination: { page: +page, limit: +limit, total: result?.total || 0 },
    items: result?.items || [],
  });
}
