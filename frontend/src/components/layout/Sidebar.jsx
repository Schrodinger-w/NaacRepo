// NavLink is used rather than Link because it marks the current page with aria-current="page"
// and the "active" class by itself.
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { NAV_LINKS } from './navigation.js';

export default function Sidebar() {
  const { user } = useAuth();
  const links = NAV_LINKS.filter((link) => link.roles.includes(user.role));

  return (
    <nav className="sidebar" aria-label="Main menu">
      <ul>
        {links.map((link) => (
          <li key={link.to}>
            <NavLink to={link.to} end>
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
