import { Plus, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { PageHeader } from "../../components/PageHeader";
import { useToast } from "../../components/ToastProvider";
import { toSafeMessage, useStudyData } from "../../state/StudyDataProvider";
import type { GoalInput, StudyGoal } from "../../types/domain";
import { calculateGoalProgress } from "../../utils/analytics";
import { GoalCard } from "./GoalCard";
import { GoalFormDialog } from "./GoalFormDialog";

export function GoalsPage() {
  const { subjects, sessions, goals, loading, saving, createGoal, updateGoal, deleteGoal } = useStudyData();
  const { notify, notifyError } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudyGoal | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StudyGoal | null>(null);

  // Achieved goals stay on the page as evidence of what has been completed.
  const { active, achieved } = useMemo(() => {
    const achievedGoals = goals.filter((goal) => calculateGoalProgress(goal, sessions).achieved);
    return {
      achieved: achievedGoals,
      active: goals.filter((goal) => !achievedGoals.includes(goal)),
    };
  }, [goals, sessions]);

  async function handleSubmit(input: GoalInput) {
    try {
      if (editing) {
        await updateGoal(editing.id, input);
        notify("Goal updated", `"${input.title}" has been updated.`);
      } else {
        await createGoal(input);
        notify("Goal added", `"${input.title}" is now being tracked.`);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      notifyError("Goal not saved", toSafeMessage(error));
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteGoal(pendingDelete.id);
      notify("Goal deleted", `"${pendingDelete.title}" has been removed.`);
      setPendingDelete(null);
    } catch (error) {
      notifyError("Goal not deleted", toSafeMessage(error));
    }
  }

  if (loading) return <LoadingScreen label="Loading your goals" />;

  return (
    <div className="page">
      <PageHeader
        title="Study Goals"
        description="Set a daily or weekly target and watch your logged sessions fill it."
        action={
          <button
            type="button"
            className="button button--primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} aria-hidden="true" />
            Add goal
          </button>
        }
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target size={28} />}
          title="No goals yet"
          description="A goal turns a vague intention into something measurable, such as five hours of revision this week."
          action={
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Add your first goal
            </button>
          }
        />
      ) : (
        <>
          <section aria-labelledby="active-goals">
            <h2 id="active-goals" className="section-title">
              In progress
            </h2>
            {active.length === 0 ? (
              <p className="section-note">Every goal is complete. Add another to keep the momentum.</p>
            ) : (
              <div className="goal-grid">
                {active.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    sessions={sessions}
                    subjects={subjects}
                    onEdit={(next) => {
                      setEditing(next);
                      setFormOpen(true);
                    }}
                    onDelete={setPendingDelete}
                  />
                ))}
              </div>
            )}
          </section>

          {achieved.length > 0 ? (
            <section aria-labelledby="achieved-goals">
              <h2 id="achieved-goals" className="section-title">
                Achieved
              </h2>
              <div className="goal-grid">
                {achieved.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    sessions={sessions}
                    subjects={subjects}
                    onEdit={(next) => {
                      setEditing(next);
                      setFormOpen(true);
                    }}
                    onDelete={setPendingDelete}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <GoalFormDialog
        open={formOpen}
        goal={editing}
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
        title={`Delete ${pendingDelete?.title ?? "goal"}?`}
        message="Your study sessions stay exactly as they are. Only the goal and its progress are removed."
        confirmLabel="Delete goal"
        pending={saving}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
