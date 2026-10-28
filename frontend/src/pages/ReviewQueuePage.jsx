// FR-023, UC-010: submissions from the coordinator's own department awaiting a decision, oldest
// first, with the department's totals. Loaded fresh on each visit, with a Refresh button rather
// than a timer, because polling would hold the session open past the 30-minute idle limit.
import { Link } from 'react-router-dom';
import { useApiData } from '../hooks/useApiData.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Spinner from '../components/Spinner.jsx';
import { versionLabel } from '../utils/labels.js';
import { formatDateTime } from '../utils/format.js';

const COLUMNS = [
  { key: 'title', header: 'Title', render: (row) => <Link to={`/evidence/${row._id}`}>{row.title}</Link> },
  { key: 'uploadedBy', header: 'Submitted by', render: (row) => row.uploadedBy?.name },
  { key: 'criterion', header: 'Criterion', render: (row) => `${row.criterion.number}. ${row.criterion.name}` },
  { key: 'subMetric', header: 'Sub-metric', render: (row) => row.subMetric.code },
  { key: 'academicYear', header: 'Year' },
  { key: 'version', header: 'Version', render: (row) => versionLabel(row.currentVersion) },
  { key: 'updatedAt', header: 'Waiting since', render: (row) => formatDateTime(row.updatedAt) },
  {
    key: 'action',
    header: <span className="visually-hidden">Action</span>,
    className: 'cell-actions',
    render: (row) => (
      <Link className="btn btn-primary btn-sm" to={`/evidence/${row._id}`}>
        Review
      </Link>
    ),
  },
];

export default function ReviewQueuePage() {
  const { data, loading, error, reload } = useApiData('/evidence/review-queue');

  const refreshButton = (
    <button type="button" className="btn btn-secondary" onClick={reload} disabled={loading}>
      {loading ? 'Refreshing…' : 'Refresh'}
    </button>
  );

  let content;
  if (loading && !data) {
    content = <Spinner label="Loading the review queue…" />;
  } else if (error) {
    content = <ErrorState error={error} onRetry={reload} />;
  } else {
    content = (
      <>
        <StatusCounts counts={data.counts} />
        {data.items.length === 0 ? (
          <EmptyState title="Nothing is waiting for review.">
            New submissions from your department will appear here.
          </EmptyState>
        ) : (
          <DataTable caption="Submissions waiting for review, oldest first" columns={COLUMNS} rows={data.items} />
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Review queue"
        description={
          data
            ? `Submissions from ${data.department.name} (${data.department.code}), oldest first.`
            : 'Submissions from your department, oldest first.'
        }
        actions={refreshButton}
      />
      {content}
    </>
  );
}

// The department's totals per status (section 11.2: pending, approved and sent-back submissions).
function StatusCounts({ counts }) {
  return (
    <ul className="stat-grid" aria-label="Department totals by status">
      {['PENDING_REVIEW', 'APPROVED', 'NEEDS_REVISION'].map((status) => (
        <li key={status} className="stat-tile">
          <span className="stat-value">{counts[status]}</span>
          <StatusBadge status={status} />
        </li>
      ))}
    </ul>
  );
}
