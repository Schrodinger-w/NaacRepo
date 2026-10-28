// Deliberately static, since the UI uses no animation. role="status" makes screen readers
// announce the label.
export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="spinner" role="status">
      <span className="spinner-icon" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
