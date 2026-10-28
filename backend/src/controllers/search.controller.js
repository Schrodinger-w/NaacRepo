// GET /api/evidence?q=&criterion=&academicYear=&department=&status=&page=
// Search and filter submitted evidence (FR-034 to FR-039, UC-016). All filters can be combined.
//   - Faculty and coordinators only ever get their own department. If they ask for another
//     department, their own is used instead and the response says so (UC-016 alternative flow).
//   - The IQAC lead and admin can filter by any department.
//   - Drafts never appear here; they are private and listed only under "My evidence" (FR-018).
import Evidence from '../models/Evidence.js';
import { AUDIT_ACTIONS, DEPARTMENT_SCOPED_ROLES, EVIDENCE_STATUS } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/text.js';
import { recordAudit } from '../services/audit.service.js';
import { EVIDENCE_POPULATE, toEvidenceSummary } from '../services/evidencePresenter.js';

export const PAGE_SIZE = 10;

// A repeated parameter (?academicYear=a&academicYear=b) arrives as an array, a single one
// as a string.
const asList = (value) => (value === undefined || value === '' ? [] : [].concat(value));

export const searchEvidence = asyncHandler(async (req, res) => {
  const user = req.user;
  const keyword = (req.query.q || '').trim();
  const { criterion, department, status } = req.query;
  const academicYears = asList(req.query.academicYear);
  const page = req.query.page || 1;

  const filter = { status: status || { $ne: EVIDENCE_STATUS.DRAFT } };
  if (criterion) filter.criterion = criterion;
  if (academicYears.length > 0) filter.academicYear = { $in: academicYears };
  if (keyword) {
    const pattern = new RegExp(escapeRegex(keyword), 'i'); // case-insensitive "contains"
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  let departmentRestricted = false;
  if (DEPARTMENT_SCOPED_ROLES.includes(user.role)) {
    departmentRestricted = Boolean(department) && department !== String(user.department._id);
    filter.department = user.department._id;
  } else if (department) {
    filter.department = department;
  }

  const [total, records] = await Promise.all([
    Evidence.countDocuments(filter),
    Evidence.find(filter)
      .populate(EVIDENCE_POPULATE)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
  ]);

  // UC-016 step 10 audits retrieval. Only page 1 is logged, so paging through one search does
  // not fill the log with repeats.
  const searched = keyword || criterion || department || status || academicYears.length > 0;
  if (searched && page === 1) {
    await recordAudit(req, AUDIT_ACTIONS.EVIDENCE_SEARCHED, {
      details: { keyword, criterion, department, status, academicYears, results: total, departmentRestricted },
    });
  }

  res.json({
    items: records.map(toEvidenceSummary),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    departmentRestricted,
    // The one department a scoped role's results came from; null for institution-wide roles.
    scopedDepartment: DEPARTMENT_SCOPED_ROLES.includes(user.role) ? user.department : null,
  });
});
