import { CardMenu } from "../../components/CardMenu";
import type { StudySession, Subject } from "../../types/domain";
import { formatDuration, formatLongDate } from "../../utils/dates";

interface SessionListProps {
  sessions: StudySession[];
  subjects: Subject[];
  onEdit: (session: StudySession) => void;
  onDelete: (session: StudySession) => void;
}

export function SessionList({ sessions, subjects, onEdit, onDelete }: SessionListProps) {
  return (
    <ul className="session-list">
      {sessions.map((session) => {
        const subject = subjects.find((candidate) => candidate.id === session.subjectId);
        const name = subject?.name ?? "Removed subject";
        return (
          <li key={session.id} className="session-row">
            <span
              className="subject-dot"
              style={{ background: subject?.colour ?? "var(--text-faint)" }}
              aria-hidden="true"
            />
            <div className="session-row__body">
              <p className="session-row__title">{name}</p>
              <p className="session-row__meta">
                {formatLongDate(session.studyDate)} · {formatDuration(session.durationMinutes)}
              </p>
              {session.notes ? <p className="session-row__notes">{session.notes}</p> : null}
            </div>
            <span className="session-row__duration">{formatDuration(session.durationMinutes)}</span>
            <CardMenu
              label={`Actions for ${name} session on ${formatLongDate(session.studyDate)}`}
              items={[
                { label: "Edit session", onSelect: () => onEdit(session) },
                { label: "Delete session", onSelect: () => onDelete(session), tone: "danger" },
              ]}
            />
          </li>
        );
      })}
    </ul>
  );
}
