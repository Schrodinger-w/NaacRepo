// Shown when a page loaded correctly but has nothing to show, optionally with a next step.
export default function EmptyState({ title, children, action }) {
  return (
    <div className="empty-state">
      <p className="empty-state-title">{title}</p>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
