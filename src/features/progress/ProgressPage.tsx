import { BarChart3 } from "lucide-react";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { PageHeader } from "../../components/PageHeader";
import { ProgressBar } from "../../components/ProgressBar";
import { useStudyData } from "../../state/StudyDataProvider";
import {
  buildDailySeries,
  buildProductivitySummary,
  buildSubjectDistribution,
  buildWeeklySeries,
} from "../../utils/analytics";
import { formatDuration, todayIso } from "../../utils/dates";
import { DailyProgressChart } from "./DailyProgressChart";
import { ProductivitySummary } from "./ProductivitySummary";

export function ProgressPage() {
  const { subjects, sessions, loading } = useStudyData();

  if (loading) return <LoadingScreen label="Loading your progress" />;

  const today = todayIso();
  const daily = buildDailySeries(sessions, today);
  const weekly = buildWeeklySeries(sessions, today);
  const distribution = buildSubjectDistribution(subjects, sessions);
  const summary = buildProductivitySummary(sessions, subjects);
  const busiestWeek = Math.max(1, ...weekly.map((week) => week.minutes));

  if (sessions.length === 0) {
    return (
      <div className="page">
        <PageHeader
          title="Progress"
          description="Daily and weekly study patterns, drawn from the sessions you log."
        />
        <EmptyState
          icon={<BarChart3 size={28} />}
          title="Nothing to report yet"
          description="Once you log a study session, this page shows your daily pattern, weekly totals and where your time goes."
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Progress"
        description="Daily and weekly study patterns, drawn from the sessions you log."
      />

      <div className="progress-grid">
        <section className="card progress-grid__wide" aria-labelledby="daily-progress-title">
          <div className="card__header">
            <div className="card__title-group">
              <h2 id="daily-progress-title">Last seven days</h2>
              <p>How your study time is spread across the week.</p>
            </div>
          </div>
          <DailyProgressChart points={daily} caption="Study time for each of the last seven days" />
        </section>

        <section className="card" aria-labelledby="weekly-progress-title">
          <div className="card__header">
            <div className="card__title-group">
              <h2 id="weekly-progress-title">Four week comparison</h2>
              <p>Weekly totals, oldest first.</p>
            </div>
          </div>
          <ul className="weekly-list">
            {weekly.map((week) => (
              <li key={week.startDate}>
                <div className="weekly-list__head">
                  <span>{week.label}</span>
                  <strong>{formatDuration(week.minutes)}</strong>
                </div>
                <ProgressBar
                  value={(week.minutes / busiestWeek) * 100}
                  label={`Study time for the week of ${week.label}`}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="card" aria-labelledby="distribution-title">
          <div className="card__header">
            <div className="card__title-group">
              <h2 id="distribution-title">Where your time goes</h2>
              <p>Share of total study time by subject.</p>
            </div>
          </div>
          <ul className="distribution-list">
            {distribution.map(({ subject, minutes, share }) => (
              <li key={subject.id}>
                <div className="distribution-list__head">
                  <span className="subject-dot" style={{ background: subject.colour }} aria-hidden="true" />
                  <span>{subject.name}</span>
                  <span className="distribution-list__value">
                    {formatDuration(minutes)} · {share}%
                  </span>
                </div>
                <ProgressBar value={share} colour={subject.colour} label={`${subject.name} share`} />
              </li>
            ))}
          </ul>
        </section>

        <section className="card progress-grid__wide" aria-labelledby="productivity-title">
          <div className="card__header">
            <div className="card__title-group">
              <h2 id="productivity-title">Productivity summary</h2>
              <p>Patterns worked out from every session you have logged.</p>
            </div>
          </div>
          <ProductivitySummary summary={summary} subjects={subjects} />
        </section>
      </div>
    </div>
  );
}
