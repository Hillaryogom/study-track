import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog shell. Focus moves into the dialog on open, stays inside it
 * while it is open, and returns to the control that opened it on close.
 */
export function Modal({ title, description, open, onClose, children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const trapFocus = useCallback((event: KeyboardEvent) => {
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    const firstField = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    firstField?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
      if (event.key === "Tab") trapFocus(event);
    }

    document.addEventListener("keydown", onKeyDown, true);
    document.body.classList.add("no-scroll");
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.classList.remove("no-scroll");
      restoreFocusTo.current?.focus?.();
    };
  }, [open, onClose, trapFocus]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        ref={dialogRef}
      >
        <div className="modal__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        {description ? (
          <p className="modal__description" id={descriptionId}>
            {description}
          </p>
        ) : null}
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
