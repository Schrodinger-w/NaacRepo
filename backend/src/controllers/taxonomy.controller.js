// GET /api/taxonomy: the fixed lists that forms and filters need (criteria, sub-metrics,
// departments, academic years), loaded in one request.
import Criterion from '../models/Criterion.js';
import SubMetric from '../models/SubMetric.js';
import Department from '../models/Department.js';
import { ACADEMIC_YEARS } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getTaxonomy = asyncHandler(async (req, res) => {
  const [criteria, subMetrics, departments] = await Promise.all([
    Criterion.find({ isActive: true }).sort({ number: 1 }).select('number name description').lean(),
    SubMetric.find({ isActive: true }).sort({ code: 1 }).select('code name criterion').lean(),
    Department.find({ isActive: true }).sort({ code: 1 }).select('code name').lean(),
  ]);
  res.json({ criteria, subMetrics, departments, academicYears: ACADEMIC_YEARS });
});
