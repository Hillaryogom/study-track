import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

interface BrandProps {
  /** The sidebar uses the compact form, which tightens the mark and wordmark. */
  compact?: boolean;
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <Link to="/dashboard" className={`brand${compact ? " brand--compact" : ""}`} aria-label="StudyTrack home">
      <span className="brand__mark" aria-hidden="true">
        <GraduationCap size={compact ? 18 : 22} strokeWidth={2.2} />
      </span>
      <span className="brand__word">StudyTrack</span>
    </Link>
  );
}
