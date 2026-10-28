// Previous / Next buttons for long result lists (UC-016: "the system paginates the list").
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Result pages">
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        Next
      </button>
    </nav>
  );
}
