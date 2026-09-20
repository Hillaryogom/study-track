import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastTone = "success" | "error";

interface Toast {
  id: number;
  title: string;
  message?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  notify: (title: string, message?: string) => void;
  notifyError: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DISMISS_AFTER_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, title: string, message?: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, title, message, tone }]);
      window.setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      notify: (title, message) => push("success", title, message),
      notifyError: (title, message) => push("error", title, message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.tone}`}>
            <span className="toast__icon" aria-hidden="true">
              {toast.tone === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            </span>
            <span className="toast__content">
              <strong>{toast.title}</strong>
              {toast.message ? <span>{toast.message}</span> : null}
            </span>
            <button
              type="button"
              className="icon-button icon-button--subtle"
              onClick={() => dismiss(toast.id)}
              aria-label={`Dismiss notification: ${toast.title}`}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
