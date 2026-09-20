import { BookOpen, Clock, Flame, Plus, Target, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { ProgressBar } from "../../components/ProgressBar";
import { useAuth } from "../../state/AuthProvider";
import { useStudyData } from "../../state/StudyDataProvider";
import {
  buildDailySeries,
  buildProductivitySummary,
  calculateGoalProgress,
  calculateStudyStreak,
  calculateTotalMinutes,
  minutesThisWeek,
} from "../../utils/analytics";
import { formatDuration, todayIso } from "../../utils/dates";
import { MetricCard } from "./MetricCard";
import { RecentSessions } from "./RecentSessions";
import { SubjectProgressPanel } from "./SubjectProgressPanel";
import { WeeklyStudyChart } from "./WeeklyStudyChart";

export function DashboardPage() {
  const { user } = useAuth();
  const { subjects, sessions, goals, loading, error } = useStudyData();

  if (loading) return <LoadingScreen label="Loading your dashboard" />;

  const today = todayIso();
  const totalMinutes = calculateTotalMinutes(sessions);
  const weekMinutes = minutesThisWeek(sessions, today);
  const streak = calculateStudyStreak(sessions, today);
  const dailySeries = buildDailySeries(sessions, today);
  const summary = buildProductivitySummary(sessions, subjects);
  const activeGoals = goals
    .map((goal) => ({ goal, progress: calculateGoalProgress(goal, sessions) }))
    .filter((entry) => !entry.progress.achieved)
    .slice(0, 3);
  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  return (
    <div className="page">
      <header className="dashboard-welcome">
        <div>
          <h1>Welcome back, {firstName}</h1>
          <p className="page-header__description">
            Here is how your study time is adding up across your subjects.
          </p>
        </div>
        <Link className="button button--primary" to="/sessions?log=1">
          <Plus size={16} aria-hidden="true" />
          Log session
        </Link>
      </header>

      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}

      {subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={28} />}
          title="Start by adding a subject"
          description="Your dashboard fills up as soon as you have a subject to log study time against."
          action={
            <Link className="button button--primary" to="/subjects">
              Add a subject
            </Link>
          }
        />
      ) : (
        <>
          <section className="metric-grid" aria-label="Study summary">
            <MetricCard label="Total study time" value={formatDuration(totalMinutes)} icon={Clock} />
            <MetricCard
              label="This week"
              value={formatDuration(weekMinutes)}
              hint={`${summary.activeDays} active ${summary.activeDays === 1 ? "day" : "days"} in total`}
              icon={TrendingUp}
              tone="success"
            />
            <MetricCard label="Active subjects" value={String(subjects.length)} icon={BookOpen} />
            <MetricCard
              label="Current streak"
              value={`${streak} ${streak === 1 ? "day" : "days"}`}
              hint={streak > 0 ? "Keep it going" : "Log a session to start one"}
              icon={Flame}
              tone="warning"
            />
          </section>

          {sessions.length === 0 ? (
            <EmptyState
              icon={<Clock size={28} />}
              title="No study time logged yet"
              description="Log your first session and this dashboard will show your streak, weekly chart and subject progress."
              action={
                <Link className="button button--primary" to="/sessions?log=1">
                  Log your first session
                </Link>
              }
            />
          ) : (
            <div className="dashboard-grid">
              <section className="card dashboard-grid__wide" aria-labelledby="weekly-chart-title">
                <div className="card__header">
                  <div className="card__title-group">
                    <h2 id="weekly-chart-title">Study time this week</h2>
                    <p>The last seven days, including today.</p>
                  </div>
                  <span className="badge badge--primary">{formatDuration(weekMinutes)} this week</span>
                </div>
                <WeeklyStudyChart points={dailySeries} />
              </section>

              <section className="card" aria-labelledby="subject-progress-title">
                <div className="card__header">
                  <div className="card__title-group">
                    <h2 id="subject-progress-title">Subject progress</h2>
                    <p>Hours logged against the targets you set.</p>
                  </div>
                </div>
                <SubjectProgressPanel subjects={subjects} sessions={sessions} />
              </section>

              <section className="card" aria-labelledby="active-goals-title">
                <div className="card__header">
                  <div className="card__title-group">
                    <h2 id="active-goals-title">Goals in progress</h2>
                    <p>Targets you are working towards right now.</p>
                  </div>
                  <Link className="button button--small button--subtle" to="/goals">
                    View all
                  </Link>
                </div>
                {activeGoals.length === 0 ? (
                  <p className="section-note">
                    {goals.length === 0
                      ? "No goals yet. Set one to give this week a target."
                      : "Every goal is complete. Add another to keep going."}
                  </p>
                ) : (
                  <ul className="goal-mini-list">
                    {activeGoals.map(({ goal, progress }) => (
                      <li key={goal.id}>
                        <div className="goal-mini-list__head">
                          <span>{goal.title}</span>
                          <span>
                            {formatDuration(progress.completedMinutes)} / {formatDuration(progress.targetMinutes)}
                          </span>
                        </div>
                        <ProgressBar value={progress.percentage} label={`${goal.title} progress`} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="card" aria-labelledby="recent-sessions-title">
                <div className="card__header">
                  <div className="card__title-group">
                    <h2 id="recent-sessions-title">Recent sessions</h2>
                    <p>Your five most recent study sessions.</p>
                  </div>
                  <Link className="button button--small button--subtle" to="/sessions">
                    View all
                  </Link>
                </div>
                <RecentSessions sessions={sessions.slice(0, 5)} subjects={subjects} />
              </section>

              <section className="card dashboard-grid__wide" aria-labelledby="insight-title">
                <div className="card__header">
                  <div className="card__title-group">
                    <h2 id="insight-title">Productivity summary</h2>
                    <p>Worked out from the sessions you have logged.</p>
                  </div>
                  <Target size={18} aria-hidden="true" />
                </div>
                <p className="insight-text">{summary.insight}</p>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
