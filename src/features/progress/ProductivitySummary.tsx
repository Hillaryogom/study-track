import type { ProductivitySummary as Summary, Subject } from "../../types/domain";
import { formatDuration, formatLongDate } from "../../utils/dates";

interface ProductivitySummaryProps {
  summary: Summary;
  subjects: Subject[];
}

export function ProductivitySummary({ summary, subjects }: ProductivitySummaryProps) {
  const mostStudied = subjects.find((subject) => subject.id === summary.mostStudiedSubjectId);

  const statistics = [
    { label: "Average session", value: formatDuration(summary.averageSessionMinutes) },
    { label: "Active days", value: String(summary.activeDays) },
    { label: "Sessions logged", value: String(summary.sessionCount) },
    {
      label: "Strongest day",
      value: summary.strongestDay ? formatLongDate(summary.strongestDay) : "Not yet",
    },
    { label: "Most studied subject", value: mostStudied?.name ?? "Not yet" },
    { label: "Total studied", value: formatDuration(summary.totalMinutes) },
  ];

  return (
    <div>
      <dl className="statistic-grid">
        {statistics.map((statistic) => (
          <div key={statistic.label} className="statistic">
            <dt>{statistic.label}</dt>
            <dd>{statistic.value}</dd>
          </div>
        ))}
      </dl>
      <p className="insight-text">{summary.insight}</p>
    </div>
  );
}
