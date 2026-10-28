// Mongoose only knows a model once its file has been imported. Importing this file once at
// startup registers all eight, so populate('department') works on routes that never import
// Department.js themselves.
import Department from './Department.js';
import User from './User.js';
import Criterion from './Criterion.js';
import SubMetric from './SubMetric.js';
import Evidence from './Evidence.js';
import EvidenceVersion from './EvidenceVersion.js';
import Review from './Review.js';
import AuditLog from './AuditLog.js';

export { Department, User, Criterion, SubMetric, Evidence, EvidenceVersion, Review, AuditLog };

export const ALL_MODELS = [Department, User, Criterion, SubMetric, Evidence, EvidenceVersion, Review, AuditLog];
