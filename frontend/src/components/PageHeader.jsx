// The title row of every page. It also sets the tab title, which is what screen readers
// announce when the page changes in a single-page app.
import { useEffect } from 'react';

export default function PageHeader({ title, description, actions }) {
  useEffect(() => {
    document.title = `${title} · NAAC Evidence Repository`;
  }, [title]);

  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
