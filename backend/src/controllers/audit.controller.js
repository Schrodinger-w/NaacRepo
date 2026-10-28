// GET /api/audit-logs?action=&email=&from=&to=&page=  (admin only; FR-043, UC-021, US-012)
// Newest entries first, 25 per page. Filters can be combined:
//   action  one audit action, e.g. EVIDENCE_REJECTED
//   email   part of the email address of the person who acted
//   from/to a date range (YYYY-MM-DD, inclusive, server's local time)
import AuditLog from '../models/AuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/text.js';

const PAGE_SIZE = 25;

export const listAuditLogs = asyncHandler(async (req, res) => {
  const { action, email, from, to } = req.query;
  const page = req.query.page || 1;

  const filter = {};
  if (action) filter.action = action;
  if (email && email.trim()) filter.userEmailSnapshot = new RegExp(escapeRegex(email.trim()), 'i');
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00`);
    if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999`);
  }

  const [total, entries] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter)
      .populate('user', 'name')
      .populate('evidence', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
  ]);

  res.json({
    items: entries.map((entry) => ({
      _id: entry._id,
      createdAt: entry.createdAt,
      action: entry.action,
      userName: entry.user?.name || '',
      userEmail: entry.userEmailSnapshot,
      // A deleted draft no longer exists, so its title is taken from the entry's details instead.
      evidence: entry.evidence
        ? { _id: entry.evidence._id, title: entry.evidence.title }
        : entry.details?.title
          ? { _id: null, title: entry.details.title }
          : null,
      details: entry.details || {},
      ipAddress: entry.ipAddress,
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
});
