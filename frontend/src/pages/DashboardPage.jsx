// FR-040, UC-017, US-008: per-criterion progress across all departments, the submission counts,
// the sub-metrics still without approved evidence, and AC-05's link through to each criterion's
// evidence list.
import { Link } from 'react-router-dom';
import { useApiData } from '../hooks/useApiData.js';
import PageHeader from '../components/PageHeader.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorState from '../components/ErrorState.jsx';

export default function DashboardPage() {
  const { data, loading, error, reload } = useApiData('/dashboard/criteria');

  const refreshButton = (
    <button type="button" className="btn btn-secondary" onClick={reload} disabled={loading}>
      {loading ? 'Refreshing…' : 'Refresh'}
    </button>
  );

  let content;
  if (loading && !data) {
    content = <Spinner label="Loading the dashboard…" />;
  } else if (error) {
    content = <ErrorState error={error} onRetry={reload} />;
  } else {
    content = (
      <>
        <OverallTiles overall={data.overall} />
        <div className="criterion-list">
          {data.criteria.map((criterion) => (
            <CriterionCard key={criterion._id} criterion={criterion} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Institutional progress"
        description="NAAC readiness for each criterion, across all departments. Click a criterion to see its evidence."
        actions={refreshButton}
      />
      {/* Decision 6: the SRS does not define completion, so the metric is labelled honestly. */}
      <p className="alert alert-info">
        <strong>Prototype coverage metric — not an official NAAC calculation.</strong> Completion is the share of a
        criterion&apos;s sub-metrics that have at least one approved piece of evidence. Only approved evidence counts.
      </p>
      {content}
    </>
  );
}

function OverallTiles({ overall }) {
  return (
    <ul className="stat-grid" aria-label="Whole-institution totals">
      <li className="stat-tile">
        <span className="stat-value">{overall.completionPercent}%</span>
        <span>
          Overall coverage ({overall.coveredSubMetrics} of {overall.totalSubMetrics} sub-metrics)
        </span>
      </li>
      <li className="stat-tile">
        <span className="stat-value">{overall.submissions}</span>
        <span>Submissions</span>
      </li>
      <li className="stat-tile">
        <span className="stat-value">{overall.approved}</span>
        <StatusBadge status="APPROVED" />
      </li>
      <li className="stat-tile">
        <span className="stat-value">{overall.pending}</span>
        <StatusBadge status="PENDING_REVIEW" />
      </li>
      <li className="stat-tile">
        <span className="stat-value">{overall.needsRevision}</span>
        <StatusBadge status="NEEDS_REVISION" />
      </li>
    </ul>
  );
}

function CriterionCard({ criterion }) {
  const { number, name, completionPercent, coveredSubMetrics, totalSubMetrics, submissions, counts, uncovered } = criterion;
  return (
    <article className="card criterion-card" aria-labelledby={`criterion-${number}`}>
      <div className="criterion-card-top">
        <h2 id={`criterion-${number}`}>
          Criterion {number}: {name}
        </h2>
        <span className="criterion-percent">{completionPercent}%</span>
      </div>
      <ProgressBar percent={completionPercent} label={`Criterion ${number} completion`} />
      <p className="muted">
        {coveredSubMetrics} of {totalSubMetrics} sub-metrics have approved evidence · {submissions}{' '}
        {submissions === 1 ? 'submission' : 'submissions'}
      </p>
      <p className="criterion-counts">
        <StatusBadge status="APPROVED" /> {counts.APPROVED} <StatusBadge status="PENDING_REVIEW" /> {counts.PENDING_REVIEW}{' '}
        <StatusBadge status="NEEDS_REVISION" /> {counts.NEEDS_REVISION}
      </p>
      {uncovered.length > 0 && (
        <p className="criterion-gaps">
          <strong>Still missing:</strong> {uncovered.map((s) => `${s.code} ${s.name}`).join('; ')}
        </p>
      )}
      <Link to={`/search?criterion=${criterion._id}`}>View the evidence for criterion {number}</Link>
    </article>
  );
}
