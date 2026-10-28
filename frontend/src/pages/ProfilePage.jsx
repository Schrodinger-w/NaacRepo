// "My profile": the signed-in user's details (FR-005) and the change-password form (FR-004).
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { apiRequest } from '../api/client.js';
import FormField from '../components/FormField.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { roleLabel } from '../utils/labels.js';
import { formatDateTime } from '../utils/format.js';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader title="My profile" description="Your account details. Ask the system administrator to correct them." />
      <div className="two-column">
        <section className="card" aria-labelledby="account-details-title">
          <h2 id="account-details-title">Account details</h2>
          <dl className="detail-list">
            <div>
              <dt>Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{user.phone || 'Not provided'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{roleLabel(user.role)}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>
                {user.department
                  ? `${user.department.name} (${user.department.code})`
                  : 'Not applicable (institution-wide role)'}
              </dd>
            </div>
            <div>
              <dt>Last sign-in</dt>
              <dd>{formatDateTime(user.lastLoginAt)}</dd>
            </div>
          </dl>
        </section>

        <ChangePasswordForm />
      </div>
    </>
  );
}

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

function ChangePasswordForm() {
  const [values, setValues] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // One handler for all three fields: FormField sets each input's name to its id.
  function handleChange(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    // Browser-side checks for instant feedback. The server enforces the full password rules.
    const errors = {};
    if (!values.currentPassword) errors.currentPassword = 'Enter your current password.';
    if (values.newPassword.length < 8) errors.newPassword = 'Use at least 8 characters.';
    if (values.confirmPassword !== values.newPassword) errors.confirmPassword = 'The two new passwords do not match.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const data = await apiRequest('/auth/change-password', {
        method: 'POST',
        body: { currentPassword: values.currentPassword, newPassword: values.newPassword },
      });
      setSuccessMessage(data.message);
      setValues(EMPTY_FORM);
    } catch (err) {
      setFormError(err.message);
      setFieldErrors(err.fieldErrors || {});
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card" aria-labelledby="change-password-title">
      <h2 id="change-password-title">Change password</h2>
      <form onSubmit={handleSubmit} noValidate>
        {successMessage && (
          <p className="alert alert-success" role="status">
            {successMessage}
          </p>
        )}
        {formError && (
          <p className="alert alert-error" role="alert">
            {formError}
          </p>
        )}

        <FormField
          id="currentPassword"
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={values.currentPassword}
          onChange={handleChange}
          error={fieldErrors.currentPassword}
          required
        />
        <FormField
          id="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="8 to 64 characters, with at least one letter and one number."
          value={values.newPassword}
          onChange={handleChange}
          error={fieldErrors.newPassword}
          required
        />
        <FormField
          id="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange}
          error={fieldErrors.confirmPassword}
          required
        />

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </section>
  );
}
