import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Destructive actions always ask first and name exactly what will be removed. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="button button--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="button button--danger" onClick={onConfirm} disabled={pending}>
            {pending ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-message">{message}</p>
    </Modal>
  );
}
