// FR-008: the sidebar links each role may use. Hiding a link is only a convenience; the page
// checks the role again through RequireRole, and the API checks it on every request.
const ALL_ROLES = ['FACULTY', 'COORDINATOR', 'IQAC_LEAD', 'ADMIN'];

export const NAV_LINKS = [
  { to: '/my-evidence', label: 'My evidence', roles: ['FACULTY'] },
  { to: '/evidence/new', label: 'Upload evidence', roles: ['FACULTY'] },
  { to: '/review-queue', label: 'Review queue', roles: ['COORDINATOR'] },
  { to: '/dashboard', label: 'Dashboard', roles: ['IQAC_LEAD'] },
  { to: '/admin/users', label: 'Users', roles: ['ADMIN'] },
  { to: '/admin/audit-log', label: 'Audit log', roles: ['ADMIN'] },
  { to: '/admin/criteria', label: 'Criteria and sub-metrics', roles: ['ADMIN'] },
  { to: '/search', label: 'Search evidence', roles: ALL_ROLES },
  { to: '/profile', label: 'My profile', roles: ALL_ROLES },
];

// Where each role lands after signing in, and where the logo links to.
const HOME_PATHS = {
  FACULTY: '/my-evidence',
  COORDINATOR: '/review-queue',
  IQAC_LEAD: '/dashboard',
  ADMIN: '/admin/users',
};

export function homePathFor(role) {
  return HOME_PATHS[role] || '/profile';
}
