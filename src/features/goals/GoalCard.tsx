import { CheckCircle2 } from "lucide-react";
import { CardMenu } from "../../components/CardMenu";
import { ProgressBar } from "../../components/ProgressBar";
import type { StudyGoal, StudySession, Subject } from "../../types/domain";
import { calculateGoalProgress } from "../../utils/analytics";
import { formatDateRange, formatDuration } from "../../utils/dates";

interface GoalCardProps {
  goal: StudyGoal;
  sessions: StudySession[];
  subjects: Subject[];
  onEdit: (goal: StudyGoal) => void;
  onDelete: (goal: StudyGoal) => void;
}

export function GoalCard({ goal, sessions, subjects, onEdit, onDelete }: GoalCardProps) {
  const progress = calculateGoalProgress(goal, sessions);
  const subject = subjects.find((candidate) => candidate.id === goal.subjectId);
  const scope = subject?.name ?? "All subjects";

  return (
    <article className="goal-card">
      <div className="goal-card__top">
        <div>
          <h3>{goal.title}</h3>
          <p className="goal-card__scope">
            {goal.period === "daily" ? "Daily" : "Weekly"} · {scope} · {formatDateRange(goal.startDate, goal.endDate)}
          </p>
        </div>
        <CardMenu
          label={`Actions for ${goal.title}`}
          items={[
            { label: "Edit goal", onSelect: () => onEdit(goal) },
            { label: "Delete goal", onSelect: () => onDelete(goal), tone: "danger" },
          ]}
        />
      </div>

      <ProgressBar
        value={progress.percentage}
        colour={progress.achieved ? "var(--success)" : subject?.colour ?? "var(--primary-600)"}
        label={`${goal.title} progress`}
      />

      <div className="goal-card__meta">
        <span>
          {formatDuration(progress.completedMinutes)} of {formatDuration(progress.targetMinutes)}
        </span>
        {progress.achieved ? (
          <span className="badge badge--success">
            <CheckCircle2 size={14} aria-hidden="true" />
            Achieved
          </span>
        ) : (
          <span className="goal-card__remaining">{formatDuration(progress.remainingMinutes)} to go</span>
        )}
      </div>
    </article>
  );
}
