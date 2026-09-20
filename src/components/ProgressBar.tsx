interface ProgressBarProps {
  value: number;
  colour?: string;
  label: string;
}

export function ProgressBar({ value, colour = "var(--primary-600)", label }: ProgressBarProps) {
  const safe = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      className="progress-bar"
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span className="progress-bar__fill" style={{ width: `${safe}%`, background: colour }} />
    </div>
  );
}
