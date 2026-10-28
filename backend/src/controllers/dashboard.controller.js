// GET /api/dashboard/criteria: the IQAC lead's institution-wide progress per NAAC criterion
// (FR-040, UC-017, US-008 AC-01 to AC-05).
//
// The SRS does not define completion, so the team defined it as below and the UI labels it as a
// prototype metric rather than an official NAAC figure:
//   sub-metrics of the criterion with at least one APPROVED evidence
//   --------------------------------------------------------------- x 100
//                 all sub-metrics of the criterion
// AC-03: only APPROVED evidence counts. AC-04: the submission counts cover every status except
// DRAFT, since drafts have not been submitted.
import Criterion from '../models/Criterion.js';
import SubMetric from '../models/SubMetric.js';
import Evidence from '../models/Evidence.js';
import { EVIDENCE_STATUS } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCriteriaProgress = asyncHandler(async (req, res) => {
  const [criteria, subMetrics, statusRows, approvedSubMetricRows] = await Promise.all([
    Criterion.find({ isActive: true }).sort({ number: 1 }).lean(),
    SubMetric.find({ isActive: true }).sort({ code: 1 }).lean(),
    // How many submitted records each criterion has in each status.
    Evidence.aggregate([
      { $match: { status: { $ne: EVIDENCE_STATUS.DRAFT } } },
      { $group: { _id: { criterion: '$criterion', status: '$status' }, count: { $sum: 1 } } },
    ]),
    // Every sub-metric that has at least one approved record.
    Evidence.aggregate([{ $match: { status: EVIDENCE_STATUS.APPROVED } }, { $group: { _id: '$subMetric' } }]),
  ]);

  const coveredIds = new Set(approvedSubMetricRows.map((row) => String(row._id)));

  const progress = criteria.map((criterion) => {
    const own = subMetrics.filter((s) => String(s.criterion) === String(criterion._id));
    const covered = own.filter((s) => coveredIds.has(String(s._id)));

    const counts = { PENDING_REVIEW: 0, APPROVED: 0, NEEDS_REVISION: 0 };
    for (const row of statusRows) {
      if (String(row._id.criterion) === String(criterion._id)) counts[row._id.status] = row.count;
    }

    return {
      _id: criterion._id,
      number: criterion.number,
      name: criterion.name,
      totalSubMetrics: own.length,
      coveredSubMetrics: covered.length,
      completionPercent: own.length === 0 ? 0 : Math.round((covered.length / own.length) * 100),
      submissions: counts.PENDING_REVIEW + counts.APPROVED + counts.NEEDS_REVISION,
      counts,
      // The gaps to work on before the accreditation visit (US-008).
      uncovered: own.filter((s) => !coveredIds.has(String(s._id))).map((s) => ({ code: s.code, name: s.name })),
    };
  });

  const totalSubMetrics = progress.reduce((sum, c) => sum + c.totalSubMetrics, 0);
  const coveredSubMetrics = progress.reduce((sum, c) => sum + c.coveredSubMetrics, 0);
  res.json({
    criteria: progress,
    overall: {
      totalSubMetrics,
      coveredSubMetrics,
      completionPercent: totalSubMetrics === 0 ? 0 : Math.round((coveredSubMetrics / totalSubMetrics) * 100),
      submissions: progress.reduce((sum, c) => sum + c.submissions, 0),
      approved: progress.reduce((sum, c) => sum + c.counts.APPROVED, 0),
      pending: progress.reduce((sum, c) => sum + c.counts.PENDING_REVIEW, 0),
      needsRevision: progress.reduce((sum, c) => sum + c.counts.NEEDS_REVISION, 0),
    },
  });
});
