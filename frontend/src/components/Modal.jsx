// Built on the browser's own <dialog>, because showModal() already blocks the rest of the page,
// traps keyboard focus and closes on Escape. The children render only while it is open, so a
// form inside starts empty each time rather than keeping the last attempt's values.
import { useEffect, useId, useRef } from 'react';

export default function Modal({ open, title, onClose, children }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  // Keeps the DOM dialog in step with the `open` prop.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    // Also fires on Escape, so the parent's state follows a dismissal it did not trigger.
    <dialog ref={dialogRef} className="modal" aria-labelledby={titleId} onClose={onClose}>
      <h2 id={titleId} className="modal-title">
        {title}
      </h2>
      {open && children}
    </dialog>
  );
}
