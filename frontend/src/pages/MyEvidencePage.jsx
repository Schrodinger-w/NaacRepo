// FR-022, UC-009: everything this faculty member has created, newest first, drafts included.
// US-004: anything sent back is repeated at the top with its feedback so it cannot be missed.
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
  { key: 'criterion', header: 'Criterion', render: (row) => (row.criterion ? `${row.criterion.number}. ${row.criterion.name}` : '—') },
  { key: 'subMetric', header: 'Sub-metric', render: (row) => row.subMetric?.code || '—' },
  { key: 'academicYear', header: 'Year', render: (row) => row.academicYear || '—' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  { key: 'version', header: 'Version', render: (row) => versionLabel(row.currentVersion) },
  { key: 'updatedAt', header: 'Last updated', render: (row) => formatDateTime(row.updatedAt) },
];

export default function MyEvidencePage() {
  const { data, loading, error, reload } = useApiData('/evidence/mine');
  const uploadButton = (
    <Link className="btn btn-primary" to="/evidence/new">
      Upload evidence
    </Link>
  );

  let content;
  if (loading && !data) {
    content = <Spinner label="Loading your evidence…" />;
  } else if (error) {
    content = <ErrorState error={error} onRetry={reload} />;
  } else if (data.items.length === 0) {
    content = (
      <EmptyState title="You have not uploaded any evidence yet." action={uploadButton}>
        Upload a PDF, PNG or JPG and tag it with its NAAC criterion, sub-metric and academic year.
      </EmptyState>
    );
  } else {
    content = (
      <>
        <NeedsRevisionPanel items={data.items.filter((item) => item.status === 'NEEDS_REVISION')} />
        <DataTable caption="All evidence you have created" columns={COLUMNS} rows={data.items} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="My evidence"
        description="Everything you have uploaded. Drafts are visible only to you."
        actions={uploadButton}
      />
      {content}
    </>
  );
}

// Records sent back for revision, with the coordinator's feedback where it cannot be missed.
function NeedsRevisionPanel({ items }) {
  if (items.length === 0) return null;
  return (
    <section className="attention-panel" aria-labelledby="attention-title">
      <h2 id="attention-title">Needs your attention ({items.length})</h2>
      <ul className="attention-list">
        {items.map((item) => (
          <li key={item._id}>
            <Link to={`/evidence/${item._id}`}>{item.title}</Link>
            <p className="feedback-text">Feedback: {item.lastFeedback}</p>
            <p className="muted">Sent back on {formatDateTime(item.lastReviewedAt)}</p>
            <Link className="btn btn-primary btn-sm attention-action" to={`/evidence/${item._id}/resubmit`}>
              Revise and resubmit
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
