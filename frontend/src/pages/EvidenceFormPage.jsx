// One form serving three routes, because the fields and rules are identical in all three:
//   /evidence/new            upload new evidence (UC-004, UC-005)
//   /evidence/:id/edit       edit one of your drafts (UC-006)
//   /evidence/:id/resubmit   correct evidence that was sent back (UC-012, FR-028)
// A draft needs only a title; submitting needs every field and a file. The checks here mirror
// the server's to give instant feedback, but the server's answer is the one that decides.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useApiData } from '../hooks/useApiData.js';
import FormField from '../components/FormField.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useToast } from '../components/Toast.jsx';
import { checkEvidenceFile, FILE_INPUT_ACCEPT } from '../utils/files.js';
import { formatDateTime, formatFileSize } from '../utils/format.js';
import { versionLabel } from '../utils/labels.js';

const TITLES = { create: 'Upload evidence', edit: 'Edit draft', resubmit: 'Revise and resubmit' };

export default function EvidenceFormPage({ mode }) {
  const { id } = useParams(); // present when editing or resubmitting
  const formMode = mode || (id ? 'edit' : 'create');
  const taxonomy = useApiData('/taxonomy');
  const existing = useApiData(id ? `/evidence/${id}` : null);
  const title = TITLES[formMode];

  if ((taxonomy.loading && !taxonomy.data) || (existing.loading && !existing.data)) {
    return (
      <>
        <PageHeader title={title} />
        <Spinner label="Loading the form…" />
      </>
    );
  }
  const loadError = taxonomy.error || existing.error;
  if (loadError) {
    return (
      <>
        <PageHeader title={title} />
        <ErrorState error={loadError} onRetry={taxonomy.error ? taxonomy.reload : existing.reload} />
      </>
    );
  }

  const evidence = existing.data?.evidence || null;
  const allowed = !evidence || (formMode === 'resubmit' ? evidence.permissions.canResubmit : evidence.permissions.canEdit);
  if (!allowed) {
    return (
      <>
        <PageHeader title={title} />
        <EmptyState
          title={formMode === 'resubmit' ? 'This evidence cannot be resubmitted now.' : 'This evidence can no longer be edited here.'}
          action={
            <Link className="btn btn-secondary" to={`/evidence/${evidence._id}`}>
              View the evidence
            </Link>
          }
        >
          {formMode === 'resubmit'
            ? 'Only evidence that a coordinator sent back for revision can be resubmitted, and only by its author.'
            : 'Only drafts can be edited. Submitted evidence is being reviewed, and approved evidence is locked.'}
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={title}
        description={
          formMode === 'resubmit'
            ? 'Correct the details or upload a corrected file, then resubmit. A new file becomes a new version; the old one is kept.'
            : 'Tag the file with its NAAC criterion, sub-metric and academic year. Your department is added automatically.'
        }
      />
      <EvidenceForm taxonomy={taxonomy.data} evidence={evidence} mode={formMode} />
    </>
  );
}

const EMPTY_VALUES = { title: '', description: '', criterion: '', subMetric: '', academicYear: '' };

function valuesFrom(evidence) {
  if (!evidence) return EMPTY_VALUES;
  return {
    title: evidence.title,
    description: evidence.description,
    criterion: evidence.criterion?._id || '',
    subMetric: evidence.subMetric?._id || '',
    academicYear: evidence.academicYear,
  };
}

function EvidenceForm({ taxonomy, evidence, mode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();
  const [values, setValues] = useState(() => valuesFrom(evidence));
  const [file, setFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [savingAs, setSavingAs] = useState(null); // 'draft', 'submit' or 'resubmit' while a request runs
  const resubmitting = mode === 'resubmit';

  // FR-015 / AC-06: only the sub-metrics of the chosen criterion can be picked.
  const subMetricOptions = taxonomy.subMetrics.filter((subMetric) => subMetric.criterion === values.criterion);

  function handleChange(event) {
    const { name, value } = event.target;
    if (name === 'criterion') {
      // Changing the criterion clears a sub-metric that belongs to a different criterion.
      const keepSubMetric = taxonomy.subMetrics.some((s) => s._id === values.subMetric && s.criterion === value);
      setValues({ ...values, criterion: value, subMetric: keepSubMetric ? values.subMetric : '' });
    } else {
      setValues({ ...values, [name]: value });
    }
  }

  function handleFileChange(event) {
    const chosen = event.target.files[0] || null;
    setFile(chosen);
    // Check type and size the moment a file is picked (FR-010, FR-011).
    setFieldErrors({ ...fieldErrors, file: chosen ? checkEvidenceFile(chosen) : undefined });
  }

  function checkInBrowser(intent) {
    const errors = {};
    if (!values.title.trim()) errors.title = 'Enter a title.';
    else if (values.title.trim().length > 200) errors.title = 'Keep the title under 200 characters.';
    if (values.description.length > 2000) errors.description = 'Keep the description under 2000 characters.';
    if (file && checkEvidenceFile(file)) errors.file = checkEvidenceFile(file);
    if (intent !== 'draft') {
      if (!values.criterion) errors.criterion = 'Choose a NAAC criterion.';
      if (!values.subMetric) errors.subMetric = 'Choose a sub-metric.';
      if (!values.academicYear) errors.academicYear = 'Choose an academic year.';
      if (!file && !evidence?.file) errors.file = 'Attach the evidence file (PDF, PNG or JPG).';
    }
    return errors;
  }

  async function save(intent) {
    const errors = checkInBrowser(intent);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError(intent === 'draft' ? 'Please correct the highlighted fields.' : 'Complete the highlighted fields before submitting.');
      return;
    }
    setFormError('');

    // Files cannot travel as JSON, so the form is sent as multipart FormData.
    const form = new FormData();
    if (intent !== 'resubmit') form.append('intent', intent);
    for (const [name, value] of Object.entries(values)) form.append(name, value);
    if (file) form.append('file', file);

    setSavingAs(intent);
    try {
      let data;
      if (intent === 'resubmit') data = await apiRequest(`/evidence/${evidence._id}/resubmit`, { method: 'POST', body: form });
      else if (evidence) data = await apiRequest(`/evidence/${evidence._id}`, { method: 'PATCH', body: form });
      else data = await apiRequest('/evidence', { method: 'POST', body: form });
      showToast(data.message); // AC-10: on-screen confirmation
      navigate(`/evidence/${data.evidence._id}`);
    } catch (err) {
      setFormError(err.message);
      setFieldErrors(err.fieldErrors || {});
      setSavingAs(null);
    }
  }

  // Enter saves a draft when creating or editing and does nothing on the resubmit form, so it
  // can never submit to the coordinator by accident.
  function handleFormSubmit(event) {
    event.preventDefault();
    if (!resubmitting) save('draft');
  }

  const busy = savingAs !== null;
  let fileHint = 'PDF, PNG or JPG, up to 10 MB.';
  if (evidence?.file) {
    fileHint = resubmitting
      ? `Current file: ${evidence.file.originalName} (${versionLabel(evidence.currentVersion)}). Upload a corrected file to create a new version; the current one stays in the history. Leave this empty to keep it.`
      : `Current file: ${evidence.file.originalName} (${formatFileSize(evidence.file.sizeBytes)}). Choose a file only if you want to replace it.`;
  }

  return (
    <form className="card form-card" onSubmit={handleFormSubmit} noValidate>
      {resubmitting && (
        <div className="alert alert-error">
          <p>
            <strong>Feedback from {evidence.lastReviewedBy?.name || 'the reviewer'}</strong> on{' '}
            {formatDateTime(evidence.lastReviewedAt)}:
          </p>
          <p className="feedback-text">{evidence.lastFeedback}</p>
        </div>
      )}
      {formError && (
        <p className="alert alert-error" role="alert">
          {formError}
        </p>
      )}
      <p className="form-legend">
        Fields marked <span className="required-mark">*</span> are needed to submit for review.
        {!resubmitting && ' A draft only needs a title.'}
      </p>

      <FormField id="title" label="Title" required maxLength={200} value={values.title} onChange={handleChange} error={fieldErrors.title} />
      <FormField
        id="description"
        label="Description"
        as="textarea"
        rows={4}
        maxLength={2000}
        hint="Optional: a short summary of what this evidence shows."
        value={values.description}
        onChange={handleChange}
        error={fieldErrors.description}
      />

      <div className="form-grid">
        <FormField id="criterion" label="NAAC criterion" as="select" required value={values.criterion} onChange={handleChange} error={fieldErrors.criterion}>
          <option value="">Choose a criterion</option>
          {taxonomy.criteria.map((criterion) => (
            <option key={criterion._id} value={criterion._id}>
              {criterion.number}. {criterion.name}
            </option>
          ))}
        </FormField>

        <FormField
          id="subMetric"
          label="Sub-metric"
          as="select"
          required
          disabled={!values.criterion}
          hint={values.criterion ? undefined : 'Choose a criterion first.'}
          value={values.subMetric}
          onChange={handleChange}
          error={fieldErrors.subMetric}
        >
          <option value="">{values.criterion ? 'Choose a sub-metric' : '—'}</option>
          {subMetricOptions.map((subMetric) => (
            <option key={subMetric._id} value={subMetric._id}>
              {subMetric.code} {subMetric.name}
            </option>
          ))}
        </FormField>

        <FormField id="academicYear" label="Academic year" as="select" required value={values.academicYear} onChange={handleChange} error={fieldErrors.academicYear}>
          <option value="">Choose a year</option>
          {taxonomy.academicYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </FormField>

        {/* FR-017 / AC-08: shown for information only; the server takes it from the account. */}
        <div className="form-field">
          <span className="field-label">Department</span>
          <p className="static-value">
            {user.department.name} ({user.department.code})
          </p>
          <p className="field-hint">Filled in automatically from your account.</p>
        </div>
      </div>

      <FormField
        id="file"
        label={resubmitting ? 'Corrected file' : 'Evidence file'}
        type="file"
        required={!resubmitting}
        accept={FILE_INPUT_ACCEPT}
        hint={fileHint}
        onChange={handleFileChange}
        error={fieldErrors.file}
      />
      {file && !fieldErrors.file && (
        <p className="selected-file">
          Selected: {file.name} ({formatFileSize(file.size)})
        </p>
      )}

      <div className="form-actions">
        {resubmitting ? (
          <button type="button" className="btn btn-primary" onClick={() => save('resubmit')} disabled={busy}>
            {busy ? 'Resubmitting…' : 'Resubmit for review'}
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-primary" onClick={() => save('submit')} disabled={busy}>
              {savingAs === 'submit' ? 'Submitting…' : 'Submit for review'}
            </button>
            <button type="submit" className="btn btn-secondary" disabled={busy}>
              {savingAs === 'draft' ? 'Saving…' : 'Save as draft'}
            </button>
          </>
        )}
        <Link className="btn btn-link" to={evidence ? `/evidence/${evidence._id}` : '/my-evidence'}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
