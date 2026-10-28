// The bar at the top of every signed-in page.
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { roleLabel } from '../../utils/labels.js';

export default function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <Link to="/" className="brand-link">
        <span className="brand-mark" aria-hidden="true">N</span>
        <span>
          <span className="brand-title">NAAC Evidence Repository</span>
          <span className="brand-subtitle">Prototype · CS314 Software Development Laboratory</span>
        </span>
      </Link>

      {user && (
        <div className="header-user">
          <div className="header-user-text">
            <span className="header-user-name">{user.name}</span>
            <span className="header-user-role">
              {roleLabel(user.role)}
              {user.department ? ` · ${user.department.code}` : ''}
            </span>
          </div>
          {/* Ends the session on the server, then reloads the app on the sign-in page. */}
          <button type="button" className="btn btn-on-dark" onClick={logout}>
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
