// One labelled control with an optional hint and error, wired up for screen readers: htmlFor
// matches the control's id and aria-describedby points at the hint and error text. Using this
// everywhere is what keeps that wiring consistent across the forms.
//
// `as` picks the element ('input', 'select', 'textarea'); any other props go straight to it.
export default function FormField({ id, label, as: Control = 'input', hint, error, required = false, children, ...controlProps }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={error ? 'form-field has-error' : 'form-field'}>
      <label htmlFor={id}>
        {label}
        {required && <span className="required-mark" aria-hidden="true"> *</span>}
      </label>
      <Control
        id={id}
        name={id}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...controlProps}
      >
        {children}
      </Control>
      {hint && <p id={hintId} className="field-hint">{hint}</p>}
      {error && <p id={errorId} className="field-error">{error}</p>}
    </div>
  );
}
