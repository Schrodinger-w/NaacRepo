// Limits a page to certain roles, so typing the address shows "access denied" rather than the
// page. A convenience only: the API refuses the request as well.
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (roles.includes(user.role)) return children;

  return (
    <>
      <PageHeader title="Access denied" />
      <EmptyState
        title="This page is not available for your role."
        action={
          <Link className="btn btn-secondary" to="/">
            Go to your home page
          </Link>
        }
      />
    </>
  );
}
