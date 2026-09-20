import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

/** An empty screen is an invitation to act, so it always offers the next step. */
export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon ? (
        <span className="empty-state__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}
