// One evidence record: status, feedback, details, file preview and the actions this user may
// take (FR-024 to FR-030, UC-011). The buttons come from `permissions`, which the server works
// out with the same rules it enforces, so the page can never offer an action that would fail.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useApiData } from '../hooks/useApiData.js';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import FormField from '../components/FormField.jsx';
import { useToast } from '../components/Toast.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { DECISION_LABELS, versionLabel } from '../utils/labels.js';
import { formatDateTime, formatFileSize } from '../utils/format.js';

export default function EvidenceDetailPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApiData(`/evidence/${id}`);

  if (loading && !data) {
    return (
      <>
        <PageHeader title="Evidence" />
        <Spinner label="Loading the evidence…" />
      </>
    );
  }
  if (error) return <LoadProblem error={error} onRetry={reload} />;
  return <EvidenceDetail evidence={data.evidence} onChanged={reload} />;
}

// 403 and 404 get their own wording; anything else offers "Try again".
function LoadProblem({ error, onRetry }) {
  const back = (
    <Link className="btn btn-secondary" to="/">
      Go to your home page
    </Link>
  );
  let content = <ErrorState error={error} onRetry={onRetry} />;
  if (error.status === 403) {
    content = <EmptyState title="You do not have access to this record." action={back}>{error.message}</EmptyState>;
  } else if (error.status === 404 || error.status === 400) {
    content = <EmptyState title="This record does not exist." action={back}>It may have been deleted.</EmptyState>;
  }
  return (
    <>
      <PageHeader title="Evidence" />
      {content}
    </>
  );
}

function EvidenceDetail({ evidence, onChanged }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();
  // Which dialog is open: 'submit', 'delete', 'approve', 'reject' or null.
  const [dialog, setDialog] = useState(null);
  const { permissions } = evidence;

  function actionDone(message) {
    setDialog(null);
    showToast(message);
    onChanged(); // reload, so the new status shows straight away (AC-07)
  }

  async function submitDraft() {
    const data = await apiRequest(`/evidence/${evidence._id}/submit`, { method: 'POST' });
    actionDone(data.message);
  }

  async function deleteDraft() {
    const data = await apiRequest(`/evidence/${evidence._id}`, { method: 'DELETE' });
    showToast(data.message);
    navigate('/my-evidence');
  }

  const actions = (
    <>
      {permissions.canEdit && (
        <Link className="btn btn-secondary" to={`/evidence/${evidence._id}/edit`}>
          Edit draft
        </Link>
      )}
      {permissions.canSubmit && (
        <button type="button" className="btn btn-primary" onClick={() => setDialog('submit')}>
          Submit for review
        </button>
      )}
      {permissions.canResubmit && (
        <Link className="btn btn-primary" to={`/evidence/${evidence._id}/resubmit`}>
          Revise and resubmit
        </Link>
      )}
      {permissions.canDelete && (
        <button type="button" className="btn btn-danger" onClick={() => setDialog('delete')}>
          Delete draft
        </button>
      )}
      {permissions.canReview && (
        <>
          <button type="button" className="btn btn-primary" onClick={() => setDialog('approve')}>
            Approve
          </button>
          <button type="button" className="btn btn-danger" onClick={() => setDialog('reject')}>
            Reject
          </button>
        </>
      )}
      {permissions.canFlag && (
        <button type="button" className="btn btn-danger" onClick={() => setDialog('flag')}>
          Flag for re-audit
        </button>
      )}
    </>
  );

  return (
    <>
      <PageHeader title={evidence.title} actions={actions} />
      {user.role === 'COORDINATOR' && (
        <p className="back-link">
          <Link to="/review-queue">← Back to the review queue</Link>
        </p>
      )}
      <StatusPanel evidence={evidence} viewerIsAuthor={evidence.uploadedBy?._id === user._id} />

      <div className="detail-layout">
        <section className="card" aria-labelledby="details-title">
          <h2 id="details-title">Details</h2>
          <EvidenceFacts evidence={evidence} />
        </section>
        <section className="card" aria-labelledby="file-title">
          <h2 id="file-title">File</h2>
          <FilePreview evidence={evidence} />
        </section>
      </div>
      <VersionHistory evidence={evidence} />

      <ConfirmDialog
        open={dialog === 'submit'}
        title="Submit for review?"
        confirmLabel="Submit for review"
        onConfirm={submitDraft}
        onClose={() => setDialog(null)}
      >
        <p>
          It goes to your department coordinator as version 1.0. You cannot edit it while it is being reviewed.
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'delete'}
        title="Delete this draft?"
        confirmLabel="Delete draft"
        confirmClass="btn-danger"
        onConfirm={deleteDraft}
        onClose={() => setDialog(null)}
      >
        <p>The draft and its file are deleted permanently. This cannot be undone.</p>
      </ConfirmDialog>
      <Modal open={dialog === 'approve'} title="Approve this evidence?" onClose={() => setDialog(null)}>
        <DecisionForm decision="approve" evidence={evidence} onCancel={() => setDialog(null)} onDone={actionDone} />
      </Modal>
      <Modal open={dialog === 'reject'} title="Reject and send back for revision?" onClose={() => setDialog(null)}>
        <DecisionForm decision="reject" evidence={evidence} onCancel={() => setDialog(null)} onDone={actionDone} />
      </Modal>
      <Modal open={dialog === 'flag'} title="Flag for re-audit?" onClose={() => setDialog(null)}>
        <DecisionForm decision="flag" evidence={evidence} onCancel={() => setDialog(null)} onDone={actionDone} />
      </Modal>
    </>
  );
}

// Status, version and what happens next, including the coordinator's feedback (AC-06).
function StatusPanel({ evidence, viewerIsAuthor }) {
  const reviewer = evidence.lastReviewedBy?.name || 'the coordinator';
  return (
    <>
      <div className="status-line">
        <StatusBadge status={evidence.status} />
        <span>{versionLabel(evidence.currentVersion)}</span>
      </div>
      {evidence.status === 'DRAFT' && (
        <p className="alert alert-info">This is a draft. Only you can see it. Submit it when it is complete.</p>
      )}
      {evidence.status === 'PENDING_REVIEW' && (
        <p className="alert alert-warning">
          Waiting for review by the department coordinator.
          {viewerIsAuthor && ' It cannot be edited while it is being reviewed.'}
        </p>
      )}
      {evidence.status === 'NEEDS_REVISION' && (
        <div className="alert alert-error">
          <p>
            <strong>Changes requested</strong> by {reviewer} on {formatDateTime(evidence.lastReviewedAt)}:
          </p>
          <p className="feedback-text">{evidence.lastFeedback}</p>
        </div>
      )}
      {evidence.status === 'APPROVED' && (
        <div className="alert alert-success">
          <p>
            <strong>Approved</strong> by {reviewer} on {formatDateTime(evidence.lastReviewedAt)}. The record is locked and
            can no longer be edited.
          </p>
          {evidence.lastFeedback && <p className="feedback-text">Comment: {evidence.lastFeedback}</p>}
        </div>
      )}
    </>
  );
}

function EvidenceFacts({ evidence }) {
  return (
    <dl className="detail-list">
      <div>
        <dt>Criterion</dt>
        <dd>{evidence.criterion ? `${evidence.criterion.number}. ${evidence.criterion.name}` : '—'}</dd>
      </div>
      <div>
        <dt>Sub-metric</dt>
        <dd>{evidence.subMetric ? `${evidence.subMetric.code} ${evidence.subMetric.name}` : '—'}</dd>
      </div>
      <div>
        <dt>Academic year</dt>
        <dd>{evidence.academicYear || '—'}</dd>
      </div>
      <div>
        <dt>Department</dt>
        <dd>
          {evidence.department.name} ({evidence.department.code})
        </dd>
      </div>
      <div>
        <dt>Uploaded by</dt>
        <dd>{evidence.uploadedBy.name}</dd>
      </div>
      <div>
        <dt>Created</dt>
        <dd>{formatDateTime(evidence.createdAt)}</dd>
      </div>
      <div>
        <dt>Last updated</dt>
        <dd>{formatDateTime(evidence.updatedAt)}</dd>
      </div>
      <div>
        <dt>Description</dt>
        <dd className="feedback-text">{evidence.description || '—'}</dd>
      </div>
    </dl>
  );
}

// FR-024: PDFs in a frame, images as images. Always requested by evidence id, never by a file
// name, and the server checks access again before sending anything.
function FilePreview({ evidence }) {
  if (!evidence.file) return <p className="muted">No file has been attached yet.</p>;

  const url = `/api/evidence/${evidence._id}/file`;
  const { originalName, mimeType, sizeBytes } = evidence.file;
  return (
    <>
      {mimeType === 'application/pdf' ? (
        <iframe className="file-preview" src={url} title={`Preview of ${originalName}`} />
      ) : (
        <img className="file-preview-image" src={url} alt={`Preview of ${originalName}`} />
      )}
      <p className="file-meta">
        {originalName} · {formatFileSize(sizeBytes)}
      </p>
      <p className="file-links">
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open in a new tab
        </a>
        <a href={`${url}?download=1`}>Download</a>
      </p>
      {/* UC-011 alternative flow: if the preview fails, the reviewer downloads the file instead. */}
      <p className="muted">If the preview does not appear, download the file to inspect it.</p>
    </>
  );
}

// FR-032, UC-014: file versions and review decisions in one timeline. Everyone who can see the
// record sees it; FR-033 limits downloading an OLDER version to the coordinator and IQAC lead.
function VersionHistory({ evidence }) {
  // updatedAt in the path changes whenever the record does, which is what reloads the timeline
  // after an approval or a resubmission.
  const history = useApiData(`/evidence/${evidence._id}/history?at=${encodeURIComponent(evidence.updatedAt)}`);

  let content;
  if (history.loading && !history.data) {
    content = <Spinner label="Loading the history…" />;
  } else if (history.error) {
    content = <ErrorState error={history.error} onRetry={history.reload} />;
  } else {
    const events = [
      ...history.data.versions.map((version) => ({ kind: 'version', time: version.createdAt, item: version })),
      ...history.data.reviews.map((review) => ({ kind: 'review', time: review.reviewedAt, item: review })),
    ].sort((a, b) => new Date(a.time) - new Date(b.time));

    content =
      events.length === 0 ? (
        <p className="muted">The history starts when the evidence is first submitted.</p>
      ) : (
        <ol className="timeline">
          {events.map((event) =>
            event.kind === 'version' ? (
              <VersionEntry key={event.item._id} version={event.item} evidence={evidence} />
            ) : (
              <ReviewEntry key={event.item._id} review={event.item} />
            ),
          )}
        </ol>
      );
  }

  return (
    <section className="card history-card" aria-labelledby="history-title">
      <h2 id="history-title">Version history</h2>
      {content}
    </section>
  );
}

function VersionEntry({ version, evidence }) {
  const canDownload = version.isCurrent || evidence.permissions.canDownloadOldVersions;
  return (
    <li className="timeline-item timeline-version">
      <p className="timeline-heading">
        <strong>v{version.versionNumber}</strong> uploaded by {version.uploadedBy.name}
        {version.isCurrent && <span className="badge badge-neutral">Current</span>}
      </p>
      <p className="muted">{formatDateTime(version.createdAt)}</p>
      <p>
        {version.file.originalName} · {formatFileSize(version.file.sizeBytes)}{' '}
        {canDownload ? (
          <a href={`/api/evidence/${evidence._id}/versions/${version._id}/file`}>Download</a>
        ) : (
          <span className="muted">(older versions can be downloaded by the department coordinator and the IQAC lead)</span>
        )}
      </p>
    </li>
  );
}

function ReviewEntry({ review }) {
  return (
    <li className={`timeline-item timeline-${review.decision === 'APPROVED' ? 'approved' : 'returned'}`}>
      <p className="timeline-heading">
        <strong>{DECISION_LABELS[review.decision]}</strong> by {review.reviewer.name}
      </p>
      <p className="muted">{formatDateTime(review.reviewedAt)}</p>
      {review.comments && <p className="feedback-text">{review.comments}</p>}
    </li>
  );
}

// A yes/no dialog for actions that need no extra input (submit, delete).
function ConfirmDialog({ open, title, onClose, ...bodyProps }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <ConfirmBody onClose={onClose} {...bodyProps} />
    </Modal>
  );
}

function ConfirmBody({ children, confirmLabel, confirmClass = 'btn-primary', onConfirm, onClose }) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setWorking(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      // Show the server's reason, including any missing fields, e.g. when a draft is incomplete.
      setError([err.message, ...Object.values(err.fieldErrors || {})].join(' '));
      setWorking(false);
    }
  }

  return (
    <>
      <div className="modal-body">
        {children}
        {error && (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={working}>
          Cancel
        </button>
        <button type="button" className={`btn ${confirmClass}`} onClick={handleConfirm} disabled={working}>
          {working ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </>
  );
}

// The wording of each decision dialog. Anything that sends a record back to "Needs revision"
// requires written feedback (FR-027, BR-005, AC-04).
const DECISIONS = {
  approve: {
    explanation: 'The record is marked "Approved" and locked: the faculty member can no longer edit or delete it.',
    label: 'Comment for the faculty member (optional)',
    button: 'Approve and lock',
    buttonClass: 'btn-primary',
    feedbackRequired: false,
  },
  reject: {
    explanation: 'The record goes back to the faculty member as "Needs revision". Explain what is missing or incorrect.',
    label: 'Feedback for the faculty member',
    button: 'Reject with feedback',
    buttonClass: 'btn-danger',
    feedbackRequired: true,
  },
  flag: {
    explanation:
      'The approved record is unlocked and goes back to the faculty member as "Needs revision". After they resubmit, the department coordinator reviews it again. Explain the discrepancy you found.',
    label: 'Reason for re-audit',
    button: 'Flag for re-audit',
    buttonClass: 'btn-danger',
    feedbackRequired: true,
  },
};

// A review decision: the coordinator's approve/reject (UC-011) or the IQAC lead's re-audit flag
// (UC-013). Missing feedback is blocked here, and the server refuses it as well.
function DecisionForm({ decision, evidence, onCancel, onDone }) {
  const text = DECISIONS[decision];
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (text.feedbackRequired && !comments.trim()) {
      setError('Enter feedback explaining what needs to change.');
      return;
    }
    setWorking(true);
    setError('');
    try {
      const data = await apiRequest(`/evidence/${evidence._id}/${decision}`, { method: 'POST', body: { comments } });
      onDone(data.message);
    } catch (err) {
      setError(err.fieldErrors?.comments || err.message);
      setWorking(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="modal-body">
        <p>{text.explanation}</p>
        <FormField
          id="review-comments"
          label={text.label}
          as="textarea"
          rows={5}
          maxLength={2000}
          required={text.feedbackRequired}
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          error={error}
        />
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={working}>
          Cancel
        </button>
        <button type="submit" className={`btn ${text.buttonClass}`} disabled={working}>
          {working ? 'Saving…' : text.button}
        </button>
      </div>
    </form>
  );
}
