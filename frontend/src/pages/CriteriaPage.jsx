// Admin: the NAAC criteria and sub-metrics, read-only. They are created by the seed script;
// editing them (UC-020) is outside this prototype's agreed scope.
import { useApiData } from '../hooks/useApiData.js';
import PageHeader from '../components/PageHeader.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorState from '../components/ErrorState.jsx';

export default function CriteriaPage() {
  const { data, loading, error, reload } = useApiData('/taxonomy');

  let content;
  if (loading && !data) content = <Spinner label="Loading criteria…" />;
  else if (error) content = <ErrorState error={error} onRetry={reload} />;
  else {
    content = data.criteria.map((criterion) => (
      <section key={criterion._id} className="card criteria-block" aria-labelledby={`c-${criterion.number}`}>
        <h2 id={`c-${criterion.number}`}>
          Criterion {criterion.number}: {criterion.name}
        </h2>
        <p className="muted">{criterion.description}</p>
        <ul className="sub-metric-list">
          {data.subMetrics
            .filter((s) => s.criterion === criterion._id)
            .map((s) => (
              <li key={s._id}>
                <strong>{s.code}</strong> {s.name}
              </li>
            ))}
        </ul>
      </section>
    ));
  }

  return (
    <>
      <PageHeader title="Criteria and sub-metrics" description="Read-only. Loaded by the seed script." />
      <p className="alert alert-warning">
        The sub-metric codes and names are demo values for this prototype, not the official NAAC taxonomy.
      </p>
      {content}
    </>
  );
}
