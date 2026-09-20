import { ProgressBar } from "../../components/ProgressBar";
import type { StudySession, Subject } from "../../types/domain";
import { calculateSubjectMinutes, calculateSubjectProgress } from "../../utils/analytics";
import { formatDuration } from "../../utils/dates";

interface SubjectProgressPanelProps {
  subjects: Subject[];
  sessions: StudySession[];
}

export function SubjectProgressPanel({ subjects, sessions }: SubjectProgressPanelProps) {
  return (
    <ul className="subject-progress">
      {subjects.map((subject) => {
        const minutes = calculateSubjectMinutes(subject.id, sessions);
        const percentage = calculateSubjectProgress(subject, sessions);
        return (
          <li key={subject.id} className="subject-progress__row">
            <div className="subject-progress__head">
              <span className="subject-dot" style={{ background: subject.colour }} aria-hidden="true" />
              <span className="subject-progress__name">{subject.name}</span>
              <span className="subject-progress__value">
                {subject.targetHours
                  ? `${formatDuration(minutes)} of ${subject.targetHours}h`
                  : formatDuration(minutes)}
              </span>
            </div>
            <ProgressBar
              value={percentage}
              colour={subject.colour}
              label={`${subject.name} progress`}
            />
          </li>
        );
      })}
    </ul>
  );
}
