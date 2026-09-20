import { BookOpen } from "lucide-react";
import { CardMenu } from "../../components/CardMenu";
import { ProgressBar } from "../../components/ProgressBar";
import type { StudySession, Subject } from "../../types/domain";
import { calculateSubjectMinutes, calculateSubjectProgress } from "../../utils/analytics";
import { minutesToHours } from "../../utils/dates";

interface SubjectCardProps {
  subject: Subject;
  sessions: StudySession[];
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
}

export function SubjectCard({ subject, sessions, onEdit, onDelete }: SubjectCardProps) {
  const studiedMinutes = calculateSubjectMinutes(subject.id, sessions);
  const percentage = calculateSubjectProgress(subject, sessions);
  const studiedHours = minutesToHours(studiedMinutes);

  return (
    <article className="subject-card">
      <div className="subject-card__top">
        <span className="subject-card__icon" style={{ background: `${subject.colour}1a`, color: subject.colour }}>
          <BookOpen size={20} aria-hidden="true" />
        </span>
        <CardMenu
          label={`Actions for ${subject.name}`}
          items={[
            { label: "Edit subject", onSelect: () => onEdit(subject) },
            { label: "Delete subject", onSelect: () => onDelete(subject), tone: "danger" },
          ]}
        />
      </div>

      <h3 className="subject-card__name">{subject.name}</h3>
      {subject.description ? <p className="subject-card__description">{subject.description}</p> : null}

      <p className="subject-card__meta">
        {subject.targetHours
          ? `${studiedHours} / ${subject.targetHours} hours`
          : `${studiedHours} hours studied`}
      </p>

      {subject.targetHours ? (
        <div className="subject-card__progress">
          <ProgressBar value={percentage} colour={subject.colour} label={`${subject.name} progress`} />
          <span className="subject-card__percentage">{percentage}%</span>
        </div>
      ) : (
        <p className="subject-card__hint">Add a target to track a percentage.</p>
      )}
    </article>
  );
}
