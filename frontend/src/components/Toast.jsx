// AC-10: short confirmations such as "Evidence submitted for review." The provider wraps the
// whole app, so a message survives the navigation that often follows the action.
import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, tone = 'success') => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, message, tone }]);
      setTimeout(() => dismiss(id), 6000); // messages disappear by themselves after 6 seconds
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {/* role="status": screen readers announce new messages without moving the focus. */}
      <div className="toast-region" role="status">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.tone}`}>
            <span>{toast.message}</span>
            <button type="button" className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Dismiss message">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
