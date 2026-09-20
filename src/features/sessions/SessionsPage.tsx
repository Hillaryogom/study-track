import { Plus, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { PageHeader } from "../../components/PageHeader";
import { useToast } from "../../components/ToastProvider";
import { toSafeMessage, useStudyData } from "../../state/StudyDataProvider";
import type { SessionInput, StudySession } from "../../types/domain";
import { calculateTotalMinutes } from "../../utils/analytics";
import { addDays, formatDuration, isWithinRange, startOfWeek, todayIso } from "../../utils/dates";
import { SessionFormDialog } from "./SessionFormDialog";
import { SessionList } from "./SessionList";

type RangeFilter = "all" | "week" | "month";

const RANGES: Array<{ id: RangeFilter; label: string }> = [
  { id: "all", label: "All time" },
  { id: "week", label: "This week" },
  { id: "month", label: "Last 30 days" },
];

export function SessionsPage() {
  const { subjects, sessions, loading, saving, createSession, updateSession, deleteSession } =
    useStudyData();
  const { notify, notifyError } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudySession | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StudySession | null>(null);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("all");
  const [searchParams, setSearchParams] = useSearchParams();

  // The dashboard quick action links here with ?log=1 so the dialog opens directly.
  useEffect(() => {
    if (searchParams.get("log") !== "1") return;
    setEditing(null);
    setFormOpen(true);
    searchParams.delete("log");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Filters only change what is shown; stored sessions are never altered.
  const visible = useMemo(() => {
    const today = todayIso();
    const from =
      rangeFilter === "week" ? startOfWeek(today) : rangeFilter === "month" ? addDays(today, -29) : null;
    return sessions.filter((session) => {
      const subjectMatch = subjectFilter === "all" || session.subjectId === subjectFilter;
      const rangeMatch = from === null || isWithinRange(session.studyDate, from, today);
      return subjectMatch && rangeMatch;
    });
  }, [sessions, subjectFilter, rangeFilter]);

  async function handleSubmit(input: SessionInput) {
    try {
      if (editing) {
        await updateSession(editing.id, input);
        notify("Session updated", "Your study session has been updated.");
      } else {
        await createSession(input);
        notify("Study session added", `${formatDuration(input.durationMinutes)} logged.`);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      notifyError("Session not saved", toSafeMessage(error));
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteSession(pendingDelete.id);
      notify("Session deleted", "The study session has been removed.");
      setPendingDelete(null);
    } catch (error) {
      notifyError("Session not deleted", toSafeMessage(error));
    }
  }

  if (loading) return <LoadingScreen label="Loading your study sessions" />;

  const totalVisibleMinutes = calculateTotalMinutes(visible);

  return (
    <div className="page">
      <PageHeader
        title="Study Sessions"
        description="Log what you studied, for how long, and keep a history you can review."
        action={
          <button
            type="button"
            className="button button--primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            disabled={subjects.length === 0}
          >
            <Plus size={16} aria-hidden="true" />
            Log session
          </button>
        }
      />

      {subjects.length === 0 ? (
        <EmptyState
          icon={<Timer size={28} />}
          title="Add a subject first"
          description="Study sessions are always linked to a subject, so create one before logging time."
          action={
            <Link className="button button--primary" to="/subjects">
              Go to subjects
            </Link>
          }
        />
      ) : (
        <>
          <div className="session-toolbar">
            <div className="field field--inline">
              <label className="field__label" htmlFor="session-filter-subject">
                Filter by subject
              </label>
              <select
                id="session-filter-subject"
                className="select"
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
              >
                <option value="all">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="tab-row" role="group" aria-label="Filter by date">
              {RANGES.map((range) => (
                <button
                  key={range.id}
                  type="button"
                  className="tab-row__button"
                  aria-pressed={rangeFilter === range.id}
                  onClick={() => setRangeFilter(range.id)}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <p className="session-toolbar__total">
              {visible.length} session{visible.length === 1 ? "" : "s"} · {formatDuration(totalVisibleMinutes)}
            </p>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={<Timer size={28} />}
              title={sessions.length === 0 ? "No study sessions yet" : "Nothing matches these filters"}
              description={
                sessions.length === 0
                  ? "Log your first session to start your streak and fill in your weekly chart."
                  : "Try a different subject or date range to see more of your history."
              }
              action={
                sessions.length === 0 ? (
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => {
                      setEditing(null);
                      setFormOpen(true);
                    }}
                  >
                    Log your first session
                  </button>
                ) : undefined
              }
            />
          ) : (
            <section className="card">
              <SessionList
                sessions={visible}
                subjects={subjects}
                onEdit={(session) => {
                  setEditing(session);
                  setFormOpen(true);
                }}
                onDelete={setPendingDelete}
              />
            </section>
          )}
        </>
      )}

      <SessionFormDialog
        open={formOpen}
        session={editing}
        subjects={subjects}
        saving={saving}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this study session?"
        message="The time logged in this session will no longer count towards your subjects, goals or streak."
        confirmLabel="Delete session"
        pending={saving}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
