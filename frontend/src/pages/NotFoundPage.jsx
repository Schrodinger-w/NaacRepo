// Shown inside the app frame for any address that matches no page.
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" />
      <EmptyState
        title="There is no page at this address."
        action={
          <Link className="btn btn-secondary" to="/">
            Go to your home page
          </Link>
        }
      />
    </>
  );
}
