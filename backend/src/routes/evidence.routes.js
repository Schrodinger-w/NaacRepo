// /api/evidence. Read each route left to right: the checks run in that order and the controller
// at the end runs only if all of them passed:
//   signed in -> role -> load record + department -> action rule -> file upload -> field rules
import { Router } from 'express';
import { body, query } from 'express-validator';
import Evidence from '../models/Evidence.js';
import { ACADEMIC_YEARS, EVIDENCE_STATUS, ROLES } from '../config/constants.js';
import { requireAuth, requireRole, requireDepartment, allow } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { receiveEvidenceFile, discardUploadOnError } from '../middleware/upload.js';
import { viewRule, draftRule, reviewRule, resubmitRule, flagRule } from '../services/evidenceRules.js';
import {
  listMyEvidence,
  getEvidence,
  createEvidence,
  updateEvidence,
  deleteEvidence,
  submitEvidence,
  resubmitEvidence,
} from '../controllers/evidence.controller.js';
import { listReviewQueue, approveEvidence, rejectEvidence, flagEvidence } from '../controllers/review.controller.js';
import { streamCurrentFile } from '../controllers/file.controller.js';
import { getHistory, downloadVersionFile } from '../controllers/history.controller.js';
import { searchEvidence } from '../controllers/search.controller.js';

const router = Router();
const { FACULTY, COORDINATOR, IQAC_LEAD } = ROLES;

// Loads the record from the URL into req.evidence and refuses another department's with 403.
const loadEvidence = requireDepartment({ load: (req) => Evidence.findById(req.params.id), as: 'evidence' });

// Text fields only. The file is checked in middleware/upload.js and which fields a submission
// requires is decided in the controller.
const evidenceFieldRules = [
  body('title')
    .isString().withMessage('Enter a title.').bail()
    .trim().notEmpty().withMessage('Enter a title.')
    .isLength({ max: 200 }).withMessage('Keep the title under 200 characters.'),
  body('description')
    .optional().isString().withMessage('The description must be text.').bail()
    .trim().isLength({ max: 2000 }).withMessage('Keep the description under 2000 characters.'),
  body('criterion').optional({ values: 'falsy' }).isMongoId().withMessage('Choose a valid NAAC criterion.'),
  body('subMetric').optional({ values: 'falsy' }).isMongoId().withMessage('Choose a valid sub-metric.'),
  body('academicYear').optional({ values: 'falsy' }).isIn(ACADEMIC_YEARS).withMessage('Choose a valid academic year.'),
];
// Create and edit carry an intent; resubmit does not, because it can only submit.
const intentRule = body('intent').isIn(['draft', 'submit']).withMessage('Choose whether to save a draft or submit for review.');

// FR-027 / BR-005: sending evidence back requires written feedback.
const feedbackRules = [
  body('comments')
    .isString().withMessage('Enter feedback explaining what needs to change.').bail()
    .trim().notEmpty().withMessage('Enter feedback explaining what needs to change.')
    .isLength({ max: 2000 }).withMessage('Keep the feedback under 2000 characters.'),
];
const optionalCommentRules = [
  body('comments')
    .optional().isString().withMessage('The comment must be text.').bail()
    .trim().isLength({ max: 2000 }).withMessage('Keep the comment under 2000 characters.'),
];

// FR-034 to FR-039. Each filter is optional and they combine.
const searchRules = [
  query('q').optional().isString().withMessage('Enter the search words as text.').bail()
    .trim().isLength({ max: 100 }).withMessage('Keep the search text under 100 characters.'),
  query('criterion').optional({ values: 'falsy' }).isMongoId().withMessage('Choose a valid criterion.'),
  query('department').optional({ values: 'falsy' }).isMongoId().withMessage('Choose a valid department.'),
  query('status')
    .optional({ values: 'falsy' })
    .isIn([EVIDENCE_STATUS.PENDING_REVIEW, EVIDENCE_STATUS.APPROVED, EVIDENCE_STATUS.NEEDS_REVISION])
    .withMessage('Choose a valid status.'),
  // FR-036: one or several academic years.
  query('academicYear')
    .optional()
    .custom((value) => [].concat(value).every((year) => ACADEMIC_YEARS.includes(year)))
    .withMessage('Choose valid academic years.'),
  query('page').optional().isInt({ min: 1, max: 10000 }).withMessage('Invalid page number.').toInt(),
];

router.use(requireAuth);

// Declared before "/:id", or Express would read these words as an id.
router.get('/', searchRules, validate, searchEvidence);
router.get('/mine', requireRole(FACULTY), listMyEvidence);
router.get('/review-queue', requireRole(COORDINATOR), listReviewQueue);

// Faculty: create, edit, delete, submit and resubmit.
router.post('/', requireRole(FACULTY), receiveEvidenceFile, intentRule, evidenceFieldRules, validate, createEvidence);
router.patch('/:id', requireRole(FACULTY), loadEvidence, allow(draftRule), receiveEvidenceFile, intentRule, evidenceFieldRules, validate, updateEvidence);
router.delete('/:id', requireRole(FACULTY), loadEvidence, allow(draftRule), deleteEvidence);
router.post('/:id/submit', requireRole(FACULTY), loadEvidence, allow(draftRule), submitEvidence);
router.post('/:id/resubmit', requireRole(FACULTY), loadEvidence, allow(resubmitRule), receiveEvidenceFile, evidenceFieldRules, validate, resubmitEvidence);

// Open to anyone viewRule admits, which is why these carry no requireRole.
router.get('/:id', loadEvidence, allow(viewRule), getEvidence);
router.get('/:id/file', loadEvidence, allow(viewRule), streamCurrentFile);
router.get('/:id/history', loadEvidence, allow(viewRule), getHistory);
router.get('/:id/versions/:versionId/file', loadEvidence, allow(viewRule), downloadVersionFile);

// Coordinators: approve or send back.
router.post('/:id/approve', requireRole(COORDINATOR), loadEvidence, allow(reviewRule), optionalCommentRules, validate, approveEvidence);
router.post('/:id/reject', requireRole(COORDINATOR), loadEvidence, allow(reviewRule), feedbackRules, validate, rejectEvidence);

// IQAC lead: re-audit flag, which reuses the rejection's mandatory-feedback rules.
router.post('/:id/flag', requireRole(IQAC_LEAD), loadEvidence, allow(flagRule), feedbackRules, validate, flagEvidence);

// Must come after the routes: cleans up a stored file when any step above failed.
router.use(discardUploadOnError);

export default router;
