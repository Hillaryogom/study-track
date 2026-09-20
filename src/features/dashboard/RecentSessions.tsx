import type { StudySession, Subject } from "../../types/domain";
import { formatDuration, formatShortDate } from "../../utils/dates";

interface RecentSessionsProps {
  sessions: StudySession[];
  subjects: Subject[];
}

export function RecentSessions({ sessions, subjects }: RecentSessionsProps) {
  return (
    <ul className="recent-sessions">
      {sessions.map((session) => {
        const subject = subjects.find((candidate) => candidate.id === session.subjectId);
        return (
          <li key={session.id}>
            <span
              className="subject-dot"
              style={{ background: subject?.colour ?? "var(--text-faint)" }}
              aria-hidden="true"
            />
            <span className="recent-sessions__name">{subject?.name ?? "Removed subject"}</span>
            <span className="recent-sessions__date">{formatShortDate(session.studyDate)}</span>
            <span className="recent-sessions__duration">{formatDuration(session.durationMinutes)}</span>
          </li>
        );
      })}
    </ul>
  );
}
