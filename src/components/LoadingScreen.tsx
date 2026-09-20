interface LoadingScreenProps {
  label?: string;
  inline?: boolean;
}

export function LoadingScreen({ label = "Loading", inline = false }: LoadingScreenProps) {
  return (
    <div className={`loading${inline ? " loading--inline" : ""}`} role="status" aria-live="polite">
      <span className="loading__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
