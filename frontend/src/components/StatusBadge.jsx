// A coloured status label (FR-030). The text is always shown, so the status never depends on
// colour alone: Draft = grey, Pending review = amber, Approved = green, Needs revision = red.
import { STATUS_LABELS } from '../utils/labels.js';

const TONES = {
  DRAFT: 'neutral',
  PENDING_REVIEW: 'warning',
  APPROVED: 'success',
  NEEDS_REVISION: 'danger',
};

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${TONES[status] || 'neutral'}`}>{STATUS_LABELS[status] || status}</span>;
}
