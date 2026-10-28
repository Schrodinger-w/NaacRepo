// Two divs rather than a chart library. The aria-value attributes let screen readers announce
// the figure, and the page prints it as text as well.
export default function ProgressBar({ percent, label }) {
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
