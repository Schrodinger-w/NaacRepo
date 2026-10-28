// The frame around every signed-in page. <Outlet /> is where the router puts the current page.
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader.jsx';
import Sidebar from './Sidebar.jsx';

export default function AppShell() {
  return (
    <div className="app-shell">
      {/* Lets keyboard users jump past the header and menu straight to the page content. */}
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <AppHeader />
      <div className="app-body">
        <Sidebar />
        <main id="main-content" className="page-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
