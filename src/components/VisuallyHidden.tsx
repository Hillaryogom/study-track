import type { ReactNode } from "react";

/** Content that screen readers announce but sighted users do not see. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="visually-hidden">{children}</span>;
}
