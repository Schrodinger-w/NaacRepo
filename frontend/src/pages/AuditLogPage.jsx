// FR-043, UC-021, US-012: who did what, to which record, when and from which IP address.
// Newest first, 25 per page, with combinable filters kept in the address bar as on SearchPage.
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApiData } from '../hooks/useApiData.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Spinner from '../components/Spinner.jsx';
import FormField from '../components/FormField.jsx';
import Pagination from '../components/Pagination.jsx';
import { ACTION_LABELS } from '../utils/labels.js';

// Times with seconds, so a sequence of actions can be followed exactly.
function formatMoment(value) {
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' });
}

// Turns { reason: 'wrong password', version: '1.0' } into "reason: wrong password · version: 1.0".
function describeDetails(details) {
  return Object.entries(details)
    .filter(([key, value]) => key !== 'title' && value !== '' && value !== null && value !== undefined && !(Array.isArray(value) && value.length === 0))
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join(' · ');
}

const COLUMNS = [
  { key: 'createdAt', header: 'When', render: (row) => formatMoment(row.createdAt) },
  {
    key: 'user',
    header: 'Who',
    render: (row) => (
      <>
        {row.userName || '—'}
        <br />
        <span className="muted">{row.userEmail}</span>
      </>
    ),
  },
  { key: 'action', header: 'Action', render: (row) => <strong>{ACTION_LABELS[row.action] || row.action}</strong> },
  {
    key: 'evidence',
    header: 'Record',
    render: (row) =>
      row.evidence ? (
        row.evidence._id ? <Link to={`/evidence/${row.evidence._id}`}>{row.evidence.title}</Link> : `${row.evidence.title} (deleted)`
      ) : (
        '—'
      ),
  },
  { key: 'details', header: 'Details', render: (row) => <span className="audit-details">{describeDetails(row.details) || '—'}</span> },
  { key: 'ipAddress', header: 'IP address' },
];

export default function AuditLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const results = useApiData(`/audit-logs?${searchParams.toString()}`);

  function changePage(page) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next);
  }

  let content;
  if (results.loading && !results.data) content = <Spinner label="Loading the audit log…" />;
  else if (results.error) content = <ErrorState error={results.error} onRetry={results.reload} />;
  else if (results.data.total === 0) content = <EmptyState title="No audit entries match these filters." />;
  else {
    content = (
      <>
        <p className="result-count" role="status">
          {results.data.total} {results.data.total === 1 ? 'entry' : 'entries'}
        </p>
        <DataTable caption="Audit log entries, newest first" columns={COLUMNS} rows={results.data.items} />
        <Pagination page={results.data.page} totalPages={results.data.totalPages} onChange={changePage} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every sign-in, upload, review, file view, search and refused request. Entries can never be edited or deleted."
        actions={
          <button type="button" className="btn btn-secondary" onClick={results.reload} disabled={results.loading}>
            {results.loading ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />
      <AuditFilters key={searchParams.toString()} searchParams={searchParams} onSearch={setSearchParams} />
      {content}
    </>
  );
}

function AuditFilters({ searchParams, onSearch }) {
  const [values, setValues] = useState({
    action: searchParams.get('action') || '',
    email: searchParams.get('email') || '',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
  });

  function handleChange(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const next = new URLSearchParams();
    for (const [name, value] of Object.entries(values)) if (value.trim()) next.set(name, value.trim());
    onSearch(next);
  }

  return (
    <form className="card filter-panel" onSubmit={handleSubmit} role="search">
      <div className="filter-grid">
        <FormField id="action" label="Action" as="select" value={values.action} onChange={handleChange}>
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([action, label]) => (
            <option key={action} value={action}>
              {label}
            </option>
          ))}
        </FormField>
        <FormField id="email" label="User email contains" type="search" value={values.email} onChange={handleChange} />
        <FormField id="from" label="From date" type="date" value={values.from} onChange={handleChange} />
        <FormField id="to" label="To date" type="date" value={values.to} onChange={handleChange} />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Apply filters
        </button>
        <button type="button" className="btn btn-link" onClick={() => onSearch(new URLSearchParams())}>
          Clear filters
        </button>
      </div>
    </form>
  );
}
