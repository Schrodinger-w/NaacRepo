// FR-034 to FR-039, UC-016. Every filter is optional and they combine. They live in the address
// bar rather than in state, so a search can be bookmarked and the IQAC dashboard can link
// straight to a filtered list. What each role may see is the server's decision, not this page's.
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApiData } from '../hooks/useApiData.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Spinner from '../components/Spinner.jsx';
import FormField from '../components/FormField.jsx';
import Pagination from '../components/Pagination.jsx';
import { STATUS_LABELS, versionLabel } from '../utils/labels.js';
import { formatDateTime } from '../utils/format.js';

const COLUMNS = [
  { key: 'title', header: 'Title', render: (row) => <Link to={`/evidence/${row._id}`}>{row.title}</Link> },
  { key: 'department', header: 'Department', render: (row) => row.department?.code },
  { key: 'criterion', header: 'Criterion', render: (row) => `${row.criterion.number}. ${row.criterion.name}` },
  { key: 'subMetric', header: 'Sub-metric', render: (row) => row.subMetric.code },
  { key: 'academicYear', header: 'Year' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  { key: 'version', header: 'Version', render: (row) => versionLabel(row.currentVersion) },
  { key: 'updatedAt', header: 'Last updated', render: (row) => formatDateTime(row.updatedAt) },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const taxonomy = useApiData('/taxonomy');
  // The address bar is the single source of the filters; a change there triggers a new search.
  const results = useApiData(`/evidence?${searchParams.toString()}`);

  function changePage(page) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next);
  }

  let content;
  if (results.loading && !results.data) {
    content = <Spinner label="Searching…" />;
  } else if (results.error) {
    content = <ErrorState error={results.error} onRetry={results.reload} />;
  } else if (results.data.total === 0) {
    content = (
      <EmptyState title="No results found">Try fewer filters or different search words.</EmptyState>
    );
  } else {
    const { items, total, page, totalPages } = results.data;
    content = (
      <>
        <p className="result-count" role="status">
          {total} {total === 1 ? 'record' : 'records'} found
        </p>
        <DataTable caption="Search results" columns={COLUMNS} rows={items} />
        <Pagination page={page} totalPages={totalPages} onChange={changePage} />
      </>
    );
  }

  const scoped = results.data?.scopedDepartment;
  return (
    <>
      <PageHeader
        title="Search evidence"
        description={
          scoped
            ? `Submitted evidence from your department, ${scoped.name} (${scoped.code}). Drafts are listed under "My evidence".`
            : 'Submitted evidence from every department. Drafts are private to their authors and never appear here.'
        }
      />
      {taxonomy.data && (
        // key: re-create the form when the address changes (e.g. Back button), so it shows those filters.
        <FilterForm key={searchParams.toString()} taxonomy={taxonomy.data} searchParams={searchParams} onSearch={setSearchParams} />
      )}
      {results.data?.departmentRestricted && (
        <p className="alert alert-info" role="status">
          You can only search evidence from your own department ({scoped.code}), so your department was used instead of
          the one you chose.
        </p>
      )}
      {content}
    </>
  );
}

function FilterForm({ taxonomy, searchParams, onSearch }) {
  const [values, setValues] = useState({
    q: searchParams.get('q') || '',
    criterion: searchParams.get('criterion') || '',
    department: searchParams.get('department') || '',
    status: searchParams.get('status') || '',
  });
  const [years, setYears] = useState(searchParams.getAll('academicYear'));

  function handleChange(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  function toggleYear(year) {
    setYears(years.includes(year) ? years.filter((y) => y !== year) : [...years, year]);
  }

  // Only filled-in filters go into the address; a new search always starts on page 1.
  function handleSubmit(event) {
    event.preventDefault();
    const next = new URLSearchParams();
    for (const [name, value] of Object.entries(values)) {
      if (value.trim()) next.set(name, value.trim());
    }
    for (const year of years) next.append('academicYear', year);
    onSearch(next);
  }

  return (
    <form className="card filter-panel" onSubmit={handleSubmit} role="search">
      <div className="filter-grid">
        <FormField id="q" label="Search words" type="search" maxLength={100} hint="Looks in titles and descriptions." value={values.q} onChange={handleChange} />
        <FormField id="criterion" label="Criterion" as="select" value={values.criterion} onChange={handleChange}>
          <option value="">All criteria</option>
          {taxonomy.criteria.map((c) => (
            <option key={c._id} value={c._id}>
              {c.number}. {c.name}
            </option>
          ))}
        </FormField>
        <FormField id="department" label="Department" as="select" value={values.department} onChange={handleChange}>
          <option value="">All departments</option>
          {taxonomy.departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.code} – {d.name}
            </option>
          ))}
        </FormField>
        <FormField id="status" label="Status" as="select" value={values.status} onChange={handleChange}>
          <option value="">Any status</option>
          {['PENDING_REVIEW', 'APPROVED', 'NEEDS_REVISION'].map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </FormField>
      </div>

      {/* FR-036: one or several academic years can be ticked. */}
      <fieldset className="checkbox-group">
        <legend>Academic year</legend>
        {taxonomy.academicYears.map((year) => (
          <label key={year}>
            <input type="checkbox" checked={years.includes(year)} onChange={() => toggleYear(year)} /> {year}
          </label>
        ))}
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Search
        </button>
        <button type="button" className="btn btn-link" onClick={() => onSearch(new URLSearchParams())}>
          Clear filters
        </button>
      </div>
    </form>
  );
}
