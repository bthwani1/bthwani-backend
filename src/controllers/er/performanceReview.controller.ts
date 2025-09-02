// server/src/controllers/performanceReview.controller.ts
import { Request, Response } from 'express';
import { KpiAssignment } from '../../models/er/kpiAssignment.model';
import { PerformanceReview } from '../../models/er/performanceReview.model';

export const runReview = async (req: Request, res: Response) => {
  const { employee, periodStart, periodEnd, scores: inputScores } = req.body;
  const kpis = await KpiAssignment.find({ employee });
  const scores = kpis.map((kpi) => {
    const achieved = inputScores?.find((s: any) => s.kpi === kpi._id.toString())?.achieved || 0;
    const score = Math.min(achieved / kpi.targetValue, 1) * kpi.weight;
    return { kpi: kpi._id, achieved, score };
  });
  const totalWeight = kpis.reduce((sum, k) => sum + k.weight, 0);
  const overallScore = scores.reduce((sum, s) => sum + s.score, 0) / totalWeight;
  const review = new PerformanceReview({ employee, periodStart, periodEnd, scores, overallScore });
  await review.save();
  res.status(201).json(review);
};

export const getReviews = async (req: Request, res: Response) => {
  const list = await PerformanceReview.find({ employee: req.query.employee }).populate('scores.kpi');
  res.json(list);
};