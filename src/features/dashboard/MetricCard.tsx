import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning";
}

export function MetricCard({ label, value, hint, icon: Icon, tone = "primary" }: MetricCardProps) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span className="metric-card__icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
      {hint ? <p className="metric-card__hint">{hint}</p> : null}
    </article>
  );
}
