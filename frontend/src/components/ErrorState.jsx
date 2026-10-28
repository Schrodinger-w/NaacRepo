// Shown when a page's data could not be loaded, with a button to try again.
export default function ErrorState({ error, onRetry }) {
  return (
    <div className="alert alert-error" role="alert">
      <p>
        <strong>This could not be loaded.</strong> {error?.message}
      </p>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
