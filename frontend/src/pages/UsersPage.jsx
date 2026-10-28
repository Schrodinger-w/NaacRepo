// Admin: list every account and create new ones (FR-042, UC-019, US-011).
// Resetting passwords and changing roles are outside this prototype's agreed scope.
import { useState } from 'react';
import { apiRequest } from '../api/client.js';
import { useApiData } from '../hooks/useApiData.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Modal from '../components/Modal.jsx';
import FormField from '../components/FormField.jsx';
import { useToast } from '../components/Toast.jsx';
import { ROLE_LABELS, roleLabel } from '../utils/labels.js';
import { formatDateTime } from '../utils/format.js';

const COLUMNS = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role', render: (row) => roleLabel(row.role) },
  { key: 'department', header: 'Department', render: (row) => row.department?.code || '—' },
  { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
  { key: 'lastLoginAt', header: 'Last sign-in', render: (row) => formatDateTime(row.lastLoginAt) },
  { key: 'isActive', header: 'Account', render: (row) => (row.isActive ? 'Active' : 'Deactivated') },
];

export default function UsersPage() {
  const users = useApiData('/users');
  const taxonomy = useApiData('/taxonomy');
  const showToast = useToast();
  const [creating, setCreating] = useState(false);

  function handleCreated(message) {
    setCreating(false);
    showToast(message);
    users.reload();
  }

  let content;
  if (users.loading && !users.data) content = <Spinner label="Loading users…" />;
  else if (users.error) content = <ErrorState error={users.error} onRetry={users.reload} />;
  else content = <DataTable caption="All user accounts" columns={COLUMNS} rows={users.data.users} />;

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone who can sign in. New users receive the initial password from you and can change it under My profile."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)} disabled={!taxonomy.data}>
            Create user
          </button>
        }
      />
      {content}
      <Modal open={creating} title="Create a user" onClose={() => setCreating(false)}>
        {taxonomy.data && (
          <CreateUserForm departments={taxonomy.data.departments} onCancel={() => setCreating(false)} onCreated={handleCreated} />
        )}
      </Modal>
    </>
  );
}

const EMPTY = { name: '', email: '', role: '', department: '', phone: '', password: '' };
const NEEDS_DEPARTMENT = ['FACULTY', 'COORDINATOR'];

function CreateUserForm({ departments, onCancel, onCreated }) {
  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const needsDepartment = NEEDS_DEPARTMENT.includes(values.role);

  function handleChange(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    // Quick checks here; the server checks everything again, including duplicate emails.
    const errors = {};
    if (!values.name.trim()) errors.name = 'Enter a name.';
    if (!values.email.trim()) errors.email = 'Enter an email address.';
    if (!values.role) errors.role = 'Choose a role.';
    if (needsDepartment && !values.department) errors.department = 'Choose a department for this role.';
    if (values.password.length < 8) errors.password = 'Use at least 8 characters.';
    setFieldErrors(errors);
    setFormError('');
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const body = { ...values, department: needsDepartment ? values.department : '' };
      const data = await apiRequest('/users', { method: 'POST', body });
      onCreated(data.message);
    } catch (err) {
      setFormError(err.message);
      setFieldErrors(err.fieldErrors || {});
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="modal-body">
        {formError && (
          <p className="alert alert-error" role="alert">
            {formError}
          </p>
        )}
        <FormField id="name" label="Full name" required value={values.name} onChange={handleChange} error={fieldErrors.name} />
        <FormField id="email" label="Email address" type="email" required value={values.email} onChange={handleChange} error={fieldErrors.email} />
        <FormField id="role" label="Role" as="select" required value={values.role} onChange={handleChange} error={fieldErrors.role}>
          <option value="">Choose a role</option>
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <option key={role} value={role}>
              {label}
            </option>
          ))}
        </FormField>
        {needsDepartment && (
          <FormField id="department" label="Department" as="select" required value={values.department} onChange={handleChange} error={fieldErrors.department}>
            <option value="">Choose a department</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.code} – {d.name}
              </option>
            ))}
          </FormField>
        )}
        <FormField id="phone" label="Phone" type="tel" hint="Optional." value={values.phone} onChange={handleChange} error={fieldErrors.phone} />
        <FormField
          id="password"
          label="Initial password"
          type="password"
          autoComplete="new-password"
          required
          hint="8 to 64 characters, with at least one letter and one number. Give it to the person privately."
          value={values.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Creating…' : 'Create user'}
        </button>
      </div>
    </form>
  );
}
