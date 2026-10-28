// Wraps every page that needs a signed-in user, sending anyone else to /login and remembering
// where they were going. Per-page role limits are RequireRole's job.
//
// This only decides what the browser displays; requireAuth on each API route is the protection.
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Spinner from '../components/Spinner.jsx';

export default function RequireAuth({ children }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) return <Spinner label="Checking your session…" />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
}
