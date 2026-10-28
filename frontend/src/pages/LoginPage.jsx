// Sign-in screen (FR-001, FR-002, FR-006, FR-007).
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import FormField from '../components/FormField.jsx';
import Spinner from '../components/Spinner.jsx';

// After signing in we return the user to the page they originally asked for, but only to
// one of our own pages: never to another website, and never back to /login itself.
function safeRedirectPath(path) {
  const isOwnPage = typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
  return isOwnPage && !path.startsWith('/login') ? path : '/';
}

export default function LoginPage() {
  const { user, checking, sessionExpired, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Sign in · NAAC Evidence Repository';
  }, []);

  if (checking) return <Spinner label="Checking your session…" />;
  // Already signed in (or just signed in): leave the login page.
  if (user) return <Navigate to={safeRedirectPath(location.state?.from)} replace />;

  async function handleSubmit(event) {
    event.preventDefault();

    // Quick checks in the browser for instant feedback; the server checks again and decides.
    const errors = {};
    if (!email.trim()) errors.email = 'Enter your email address.';
    if (!password) errors.password = 'Enter your password.';
    setFieldErrors(errors);
    setFormError('');
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // Success: `user` is now set, so the next render returns <Navigate> above.
    } catch (err) {
      setFormError(err.message);
      setFieldErrors(err.fieldErrors || {});
      setPassword('');
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <main className="auth-card" aria-labelledby="login-title">
        <div className="auth-card-header">
          <span className="brand-mark" aria-hidden="true">N</span>
          <div>
            <h1 id="login-title">Sign in</h1>
            <p>NAAC Evidence Repository</p>
          </div>
        </div>

        {/* noValidate: we show our own accessible messages instead of the browser's pop-ups. */}
        <form className="auth-card-body" onSubmit={handleSubmit} noValidate>
          {sessionExpired && !formError && (
            <p className="alert alert-info" role="status">
              You were signed out after a period of inactivity. Please sign in again.
            </p>
          )}
          {formError && (
            <p className="alert alert-error" role="alert">
              {formError}
            </p>
          )}

          <FormField
            id="email"
            label="Email address"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            required
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            required
          />

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="auth-help">Forgot your password? Contact the system administrator.</p>
        </form>
      </main>
    </div>
  );
}
