export const ToastStack = ({ toasts }) => {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          className={`toast toast--${toast.variant || "info"}`}
          key={toast.id}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};
