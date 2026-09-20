import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "../../components/Modal";
import type { GoalInput, StudyGoal, Subject } from "../../types/domain";
import { goalSchema, toGoalInput, type GoalFormValues } from "./goalSchema";

interface GoalFormDialogProps {
  open: boolean;
  goal: StudyGoal | null;
  subjects: Subject[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: GoalInput) => Promise<void>;
}

const BLANK: GoalFormValues = { title: "", period: "weekly", targetHours: "", subjectId: "all" };

export function GoalFormDialog({ open, goal, subjects, saving, onClose, onSubmit }: GoalFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalFormValues>({ resolver: zodResolver(goalSchema), defaultValues: BLANK });

  useEffect(() => {
    if (!open) return;
    reset(
      goal
        ? {
            title: goal.title,
            period: goal.period,
            targetHours: String(goal.targetMinutes / 60),
            subjectId: goal.subjectId ?? "all",
          }
        : BLANK,
    );
  }, [open, goal, reset]);

  return (
    <Modal
      open={open}
      title={goal ? "Edit goal" : "Add goal"}
      description="Goals compare the time you log against a target for today or this week."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(async (values) => onSubmit(toGoalInput(values)))} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="goal-title">
            Goal title
          </label>
          <input
            id="goal-title"
            className="input"
            placeholder="e.g. Revise before the AI exam"
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title ? <span className="field__error">{errors.title.message}</span> : null}
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="goal-period">
              Period
            </label>
            <select id="goal-period" className="select" {...register("period")}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="goal-target">
              Target hours
            </label>
            <input
              id="goal-target"
              className="input"
              inputMode="decimal"
              placeholder="e.g. 5"
              aria-invalid={Boolean(errors.targetHours)}
              {...register("targetHours")}
            />
            {errors.targetHours ? <span className="field__error">{errors.targetHours.message}</span> : null}
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="goal-subject">
            Subject
          </label>
          <select id="goal-subject" className="select" {...register("subjectId")}>
            <option value="all">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <span className="field__hint">Choose a subject to focus the goal, or track all of them together.</span>
        </div>

        <div className="modal__footer">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? "Saving…" : "Save goal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
